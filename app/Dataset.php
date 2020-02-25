<?php

namespace App;

use Str;
use Storage;
use ZipArchive;
use Illuminate\Http\UploadedFile;
use Illuminate\Database\Eloquent\Model;

class Dataset extends Model
{
    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The "type" of the auto-incrementing ID.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = ['secret_slug'];

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'width',
        'height',
        'features',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'width' => 'int',
        'height' => 'int',
        'features' => 'int',
    ];

    /**
     * Store the dataset ZIP in the local storage disk.
     *
     * @param UploadedFile $zip
     * @return string|false
     */
    public function storeZip(UploadedFile $zip)
    {
        $path = $this->getLocalDiskPath();

        return Storage::disk('local')->putFileAs(dirname($path), $zip, basename($path));
    }

    /**
     * Extract the dataset ZIP to the public storage disk.
     *
     * @param UploadedFile|null $zip Optional uploaded file from which the ZIP can be extracted withput having to load it from the local storage disk.
     */
    public function publishZip(?UploadedFile $file = null)
    {
        $publicPath = $this->getPublicDiskPath();

        // 0.png is always present in a dataset. Don't publish the dataset if it already
        // has been published.
        if (Storage::disk('public')->exists("{$publicPath}/0.png")) {
            return;
        }

        if ($file === null) {
            $localPath = $this->getLocalDiskPath();
            $tmpResource = tmpfile();

            try {
                $source = Storage::disk('local')->readStream($localPath);
                stream_copy_to_stream($source, $tmpResource);
                $tmpPath = stream_get_meta_data($tmpResource)['uri'];
                $zip = new ZipArchive;
                $zip->open($tmpPath);
                $this->publishDownloadedZip($zip, $publicPath);
            } finally {
                fclose($tmpResource);
            }
        } else {
            $zip = new ZipArchive;
            $zip->open($file->getPathname());
            $this->publishDownloadedZip($zip, $publicPath);
        }
    }

    /**
     * Get the path to the dataset files in the public storage disk.
     *
     * @return string
     */
    public function getPublicDiskPath()
    {
        return Str::replaceLast('.zip', '', $this->getLocalDiskPath());
    }

    /**
     * Get the path to the ZIP file in the local storage disk.
     *
     * @return string
     */
    protected function getLocalDiskPath()
    {
        return "{$this->id[0]}{$this->id[1]}/{$this->id[2]}{$this->id[3]}/{$this->id}.zip";
    }

    /**
     * Extract the downloaded dataset ZIP file to the public storage disk.
     *
     * @param ZipArchive $zip
     * @param string $dirname
     */
    protected function publishDownloadedZip(ZipArchive $zip, string $dirname)
    {
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if ($name === 'metadata.json') {
                continue;
            }

            Storage::disk('public')->writeStream("{$dirname}/{$name}", $zip->getStream($name));
        }
    }
}
