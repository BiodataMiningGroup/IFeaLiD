import sys
import os
import numpy as np
from PIL import Image
from concurrent.futures import ProcessPoolExecutor

from mrcnn.model import MaskRCNN, resnet_graph
import mrcnn.config
import mrcnn.utils
import utils

import tensorflow.keras.layers as KL
import tensorflow.keras.models as KM

class ResNet(MaskRCNN):
   def build(self, mode, config):
      h, w = config.IMAGE_SHAPE[:2]
      if h / 2**6 != int(h / 2**6) or w / 2**6 != int(w / 2**6):
         raise Exception("Image size must be dividable by 2 at least 6 times "
                         "to avoid fractions when downscaling and upscaling."
                         "For example, use 256, 320, 384, 448, 512, ... etc. ")

      # Inputs
      input_image = KL.Input(shape=[None, None, 3], name="input_image")

      C1, C2, C3, C4, C5 = resnet_graph(input_image, "resnet101", stage5=True, train_bn=True)

      return KM.Model([input_image], [C1, C2, C3, C4, C5], name='resnet')

   def detect(self, image, verbose=0):
      molded_images, _, _ = self.mold_inputs([image])

      feature_maps = self.keras_model.predict(molded_images, verbose=0)
      feature_maps = [np.squeeze(f) for f in feature_maps]

      padding = np.array([molded_images.shape[1] - image.shape[0], molded_images.shape[2] - image.shape[1]]) // 2

      for i, f in enumerate(feature_maps):
         scaling = np.array([f.shape[0] / molded_images.shape[1], f.shape[1] / molded_images.shape[2]])
         f_padding = np.ceil(padding * scaling).astype(int)
         feature_maps[i] = f[f_padding[0]:f.shape[0] - f_padding[0], f_padding[1]:f.shape[1] - f_padding[1]]

      return feature_maps

class Config(mrcnn.config.Config):
   def __init__(self, config={}):
      self.NAME = 'unknot'
      # Add one for the background class (0).
      self.NUM_CLASSES = 2
      # Disable validation since we do not have ground truth.
      self.VALIDATION_STEPS = 0

      for key, value in config.items():
         setattr(self, key, value)

      super().__init__()

class InferenceConfig(Config):
   def __init__(self, config={}):
      self.IMAGES_PER_GPU = 1
      self.IMAGE_MIN_DIM = 64
      self.IMAGE_RESIZE_MODE = "pad64"
      super().__init__(config)

class Dataset(mrcnn.utils.Dataset):
   def __init__(self, images, name='no_name', masks=[], classes={}, ignore_classes=[]):
      super().__init__()
      # Convert to the required dict with image IDs.
      images = {k: v for k, v in enumerate(images)}

      self.images = images
      self.masks = masks
      self.name = name
      self.classes = classes
      # Always ignore the background class.
      self.ignore_classes = set([0] + ignore_classes)

   def prepare(self):
      for class_id, class_name in self.classes.items():
         self.add_class(self.name, class_id, class_name)

      for image_id, image_file in self.images.items():
         self.add_image(self.name, image_id, image_file)

      super().prepare()

   def load_mask(self, image_index):
      file = self.masks[image_index]
      data = np.load(file, allow_pickle=True)
      classes = []
      masks = []

      for mask in data['masks']:
         source_class_id = 1
         if source_class_id not in self.ignore_classes:
             classes.append(self.map_source_class_id('{}.{}'.format(self.name, source_class_id)))
             masks.append(mask)

      if len(classes) == 0:
         return super().load_mask(image_index)

      classes = np.array(classes, dtype=np.int32)
      masks = np.stack(masks, axis = 2).astype(np.bool)

      return masks, classes

class InferenceDataset(Dataset):
   def __init__(self, images):
      classes = {1: 'Interesting'}
      super().__init__(images=images, classes=classes)

class FeatureEctractor(object):
   def extract(self, images, target_dir):
      config = InferenceConfig()
      dataset = InferenceDataset(images)

      config.display()
      dataset.prepare()

      utils.ensure_dir(target_dir)

      coco_model_path = 'mask_rcnn_coco.h5'
      if not os.path.exists(coco_model_path):
         mrcnn.utils.download_trained_weights(coco_model_path)

      model = ResNet(mode="inference", config=config, model_dir=target_dir)
      exclude_layers = [
        "mrcnn_class_logits",
        "mrcnn_bbox_fc",
        "mrcnn_bbox",
        "mrcnn_mask",
      ]
      model.load_weights(coco_model_path, by_name=True, exclude=exclude_layers)

      executor = ProcessPoolExecutor(max_workers=4)

      for i, image_info in enumerate(dataset.image_info):
         image_name = os.path.basename(image_info['path'])
         print('Processing image {}'.format(image_name))
         image = dataset.load_image(i)
         features = model.detect(image)
         executor.submit(self.store_features, features[:4], os.path.join(target_dir, image_name))

      executor.shutdown(wait=True)

   def store_features(self, features, path):
      for i, f in enumerate(features):
         np.savez('{}.C{}'.format(path, i + 1), f)

target = sys.argv[1]
paths = sys.argv[2:]
e = FeatureEctractor()
e.extract(paths, target)
