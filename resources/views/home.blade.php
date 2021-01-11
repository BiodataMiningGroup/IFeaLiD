@extends('base')

@section('title', config('app.name')." - Interactive Feature Localization in Deep neural networks")

@section('content')

<div class="home-container container text-light">
    <div class="row h-100 align-items-center justify-content-center">
        <div class="col-sm-9 col-md-7 col-lg-5 col-xl-4">
            @if ($deleted)
                <div class="alert alert-success">Dataset "{{$deleted}}" was deleted.</div>
            @endif
            <h1 class="logo text-center"><img class="d-inline-block align-top" src="{{asset('logo.svg')}}" height="50"> {{config('app.name')}}</h1>
            <form class="upload-form card bg-dark border-secondary mt-3" method="POST" action="{{ url('/api/datasets') }}" enctype="multipart/form-data" onsubmit="this.elements['smbtn'].disabled = true;">
                <div class="card-body">
                    <div class="form-group">
                        <label for="file">Select the dataset ZIP file to upload:</label>
                        <input type="file" class="form-control-file @if($errors->any()) is-invalid @endif" id="file" name="file" accept="application/zip">

                        @if ($errors->any())
                            <div class="invalid-feedback">
                                @foreach ($errors->all() as $error)
                                    {{ $error }}<br>
                                @endforeach
                            </div>
                        @endif
                    </div>
                    {!! Honeypot::generate('website', 'homepage') !!}
                    @csrf
                    <button id="smbtn" type="submit" class="btn btn-block btn-outline-light mt-2" onclick="this.firstElementChild.style = '';">
                        <span class="spinner-border spinner-border-sm align-middle mr-1" style="display: none;"></span>
                        Upload dataset
                    </button>
                </div>
            </form>
            <small>
                Read the <a href="#">paper</a>. Code is on <a href="https://github.com/BiodataMiningGroup/IFeaLiD">GitHub</a>.
            </small>
        </div>
    </div>
</div>

@endsection
