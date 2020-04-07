import os

def normalize_path(base, path):
    if not os.path.isabs(path):
        path = os.path.abspath(os.path.join(base, path))

    return path

def ensure_dir(path):
   if not os.path.exists(path):
      os.makedirs(path)
