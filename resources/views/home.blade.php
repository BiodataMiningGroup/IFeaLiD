@extends('base')

@section('content')

<div class="home-container">
    <form class="upload-form" method="POST" action="{{ url('/api/datasets') }}" enctype="multipart/form-data">
        <div>
            <label for="file">Select the dataset ZIP file to upload</label>
            <input type="file" id="file" name="file" accept="application/zip">
            {!! Honeypot::generate('website', 'homepage') !!}
            @csrf
        </div>
        <input class="button" type="submit" value="Upload dataset">
        @if ($errors->any())
            <ul class="errors">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
            <div class="errors">
            </div>
        @endif
    </form>
</div>

@if ($deleted)
<br>Deleted {{$deleted}}
@endif

@endsection
