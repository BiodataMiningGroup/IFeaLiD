<?php

namespace App\Http\Requests;

use App\Dataset;
use Illuminate\Foundation\Http\FormRequest;

class ShowDataset extends FormRequest
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
        $this->dataset = Dataset::where('public_slug', $this->route('slug'))->firstOrFail();

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
            //
        ];
    }
}
