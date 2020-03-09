<?php

namespace App\Http\Requests;

use ZipArchive;
use Illuminate\Support\Facades\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreDataset extends FormRequest
{
    /**
     * Dataset metadata from the ZIP file.
     *
     * @var array
     */
    public $metadata;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'website' => 'honeypot',
            'homepage' => 'required|honeytime:5',
            'file' => 'required|file|mimetypes:application/zip|max:400000',
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if (!$this->has('file')) {
                return;
            }

            $zip = new ZipArchive;
            $resource = $zip->open($this->file('file')->getPathname());

            if ($resource !== true) {
                $validator->errors()->add('file', 'The ZIP file could not be read.');
                return;
            }

            if ($zip->numFiles === 0) {
                $validator->errors()->add('file', 'The ZIP file is empty.');
                return;
            }

            $meta = $zip->getFromName('metadata.json');
            if ($meta === false) {
                $validator->errors()->add('file', 'The ZIP file does not contain metadata.');
                return;
            }

            $meta = json_decode($meta, true);

            if ($meta === null) {
                $validator->errors()->add('file', 'The dataset metadata is no valid JSON.');
                return;
            }

            $metaValidator = Validator::make($meta, [
                'name' => 'required|string|max:512',
                'width' => 'required|integer|min:1|max:8192',
                'height' => 'required|integer|min:1|max:8192',
                'features' => 'required|integer|min:1|max:40000',
                'precision' => 'required|integer|in:8,16,32',
            ]);

            if ($metaValidator->fails()) {
                $validator->errors()->merge($metaValidator->errors());
                return;
            }

            $this->metadata = $metaValidator->validated();

            // Factor specifying how many feature channels fit into a single PNG.
            $reductionFactor = 32.0 / $this->metadata['precision'];

            $numFiles = intval(ceil($this->metadata['features'] / $reductionFactor));
            // +1 for metadata.json
            if (($numFiles + 1) !== $zip->numFiles) {
                $validator->errors()->add('file', 'The number of files does not match the number of features.');
                return;
            }

            $totalSize = 0;
            $foundMetadata = false;

            for ($i = 0; $i < $zip->numFiles; $i++) {
                $stats = $zip->statIndex($i);
                $totalSize += $stats['size'];
                if (!$foundMetadata && $stats['name'] === 'metadata.json') {
                    $foundMetadata = true;
                } else {
                    $matches = [];
                    preg_match('/([0-9]+)\.(png)/', $stats['name'], $matches);
                    if (count($matches) !== 3 || intval($matches[1]) < 0 || intval($matches[1]) >= $numFiles || $matches[2] !== 'png') {
                        $validator->errors()->add('file', "The file '{$stats['name']}' is invalid.");
                        return;
                    }
                }
            }

            if ($totalSize > 400000000) {
                $validator->errors()->add('file', 'The ZIP contents are larger than the allowed maximum of 400 MB');
                return;
            }

            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = $zip->getNameIndex($i);
                if ($name !== 'metadata.json') {
                    $info = getimagesizefromstring($zip->getFromIndex($i));
                    if ($info[0] !== $this->metadata['width'] || $info[1] !== $this->metadata['height']) {
                        $validator->errors()->add('file', "The file '{$name}' has an invalid size.");
                        return;
                    }

                    if ($info[2] !== IMAGETYPE_PNG) {
                        $validator->errors()->add('file', "The file '{$name}' is not a valid PNG.");
                        return;
                    }
                }
            }
        });
    }
}
