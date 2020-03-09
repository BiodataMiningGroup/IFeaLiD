import os
import numpy as np
from PIL import Image
import argparse
import json
from zipfile import ZipFile
import io

class ZipCreator(object):
   def __init__(self, file, name=''):
      self.file = os.path.abspath(file)
      self.out_file = '{}.zip'.format(self.file)
      self.name = os.path.basename(file) if name == '' else name

   def create(self):
      with np.load(self.file) as npz_file:
         data = npz_file[npz_file.files[0]]

      zip_file = ZipFile(self.out_file, 'w')
      metadata = {
         'name': self.name,
         'width': 0,
         'height': 0,
         'features': 0,
      }

      metadata['width'] = data.shape[1]
      metadata['height'] = data.shape[0]
      metadata['features'] = data.shape[2]
      metadata['precision'] = 8

      # Normalize to byte range.
      global_max = data.reshape(-1).max()
      global_min = data.reshape(-1).min()
      data = np.round((data - global_min) / (global_max - global_min) * 255).astype(np.uint8)

      # Add missing feature channels to make shape[2] divisible by 4.
      if data.shape[2] % 4 != 0:
         zeros = np.zeros((data.shape[0], data.shape[1], 4 - (data.shape[2] % 4)), dtype=np.uint8)
         data = np.concatenate((data, zeros), axis=2)

      splits = np.split(data, data.shape[2] // 4, axis=2)
      for i, split in enumerate(splits):
         filename = '{}.png'.format(i)
         bytes_io = io.BytesIO()
         Image.fromarray(split).save(bytes_io, format='png')
         zip_file.writestr(filename, bytes_io.getvalue())

      zip_file.writestr('metadata.json', json.dumps(metadata))
      zip_file.close()

if __name__ == '__main__':
   parser = argparse.ArgumentParser(description="Create an RTMFE ZIP from an NPZ file")
   parser.add_argument('file', type=str, help='path to the npz file')
   parser.add_argument("-n", "--name", dest='name', type=str, default='', help="optional dataset name")
   args = parser.parse_args()

   creator = ZipCreator(file=args.file, name=args.name)
   creator.create()
