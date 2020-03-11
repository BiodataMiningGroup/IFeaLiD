@extends('base')

@section('content')

<div class="home-container text-light">
    @if ($deleted)
        <div class="alert alert-success">Dataset "{{$deleted}}" was deleted.</div>
    @endif
    <form class="upload-form" method="POST" action="{{ url('/api/datasets') }}" enctype="multipart/form-data">
        <h1 class="logo"><img src="{{asset('logo.svg')}}" height="50"> vis4deep</h1>
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
        <input class="btn btn-outline-light" type="submit" value="Upload dataset">
    </form>
</div>

@endsection
