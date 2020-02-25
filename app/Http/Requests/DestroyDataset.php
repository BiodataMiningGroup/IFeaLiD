<?php

namespace App\Http\Requests;

use App\Dataset;
use Illuminate\Foundation\Http\FormRequest;

class DestroyDataset extends FormRequest
{
    /**
     * The dataset to destroy.
     *
     * @var Dataset
     */
    public $dataset;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->dataset = Dataset::findOrFail($this->route('id'));

        return $this->input('secret') === $this->dataset->secret_slug;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'secret' => 'required|string|size:10',
        ];
    }
}
