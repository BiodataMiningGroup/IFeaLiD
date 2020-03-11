<?php

namespace App\Http\Controllers;

use Exception;
use ZipArchive;
use App\Dataset;
use Illuminate\Http\Request;
use App\Http\Requests\EditDataset;
use App\Http\Requests\ShowDataset;
use App\Http\Requests\StoreDataset;
use App\Http\Requests\DestroyDataset;

class DatasetController extends Controller
{
    /**
     * Instantiate a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('throttle:5,1')->only('store');
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        return view('home', [
            'deleted' => session('deleted'),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  StoreDataset  $request
     * @return \Illuminate\Http\Response
     */
    public function store(StoreDataset $request)
    {
        $file = $request->file('file');
        $dataset = Dataset::create($request->metadata);

        try {
            $dataset->storeZip($file);
            // Publish the ZIP right away because the user is immediately redirected to
            // see the dataset.
            $dataset->publishZip($file);
        } catch (Exception $e) {
            $dataset->delete();
            throw $e;
        }

        return redirect()->route('edit', ['slug' => $dataset->secret_slug]);
    }

    /**
     * Display the specified resource in edit mode.
     *
     * @param  EditDataset  $request
     * @return \Illuminate\Http\Response
     */
    public function edit(EditDataset $request)
    {
        $request->dataset->touch();
        $request->dataset->publishZip();
        $request->dataset->makeVisible(['secret_slug']);
        $request->dataset->withUrl();

        return view('show', [
            'editable' => true,
            'dataset' => $request->dataset,
        ]);
    }

    /**
     * Display the specified resource.
     *
     * @param  ShowDataset  $request
     * @return \Illuminate\Http\Response
     */
    public function show(ShowDataset $request)
    {
        $request->dataset->touch();
        $request->dataset->publishZip();
        $request->dataset->withUrl();

        return view('show', [
            'editable' => false,
            'dataset' => $request->dataset,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  DestroyDataset  $request
     * @return \Illuminate\Http\Response
     */
    public function destroy(DestroyDataset $request)
    {
        $request->dataset->delete();

        return redirect()->route('home')->with('deleted', $request->dataset->name);
    }
}
