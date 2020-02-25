<?php

namespace App\Http\Controllers;

use ZipArchive;
use App\Dataset;
use Illuminate\Http\Request;
use App\Http\Requests\StoreDataset;

class DatasetController extends Controller
{
    /**
     * Instantiate a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('throttle:1,1')->only('store');
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        return view('home');
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  StoreDataset  $request
     * @return \Illuminate\Http\Response
     */
    public function store(StoreDataset $request)
    {
        // TODO use spam protection (same as BIIGLE sign up)

        $file = $request->file('file');
        $dataset = Dataset::create($request->metadata);
        $dataset->storeZip($file);
        // Publish the ZIP right away because the user is immediately redirected to see
        // the dataset.
        $dataset->publishZip($file);

        return redirect()->route('edit', ['slug' => $dataset->secret_slug]);
    }

    /**
     * Display the specified resource in edit mode.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function edit(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request)
    {
        //
    }
}
