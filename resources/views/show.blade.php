@extends('base')

@section('title', "{$dataset->name} - ".config('app.name'))

@section('content')
<div id="show-container" class="show-container">
    <nav class="navbar navbar-dark bg-dark">
        <a class="navbar-brand" href="{{url('')}}">
            <img src="{{asset('logo.svg')}}" width="30" height="30" class="d-inline-block align-top" alt=""> {{config('app.name')}}
        </a>
        <span class="navbar-text text-light font-weight-bold">
            {{$dataset->name}} <small>{{$dataset->width}}&times;{{$dataset->height}}&times;{{$dataset->features}} {{'@'}} {{$dataset->precision}}bit</small>
        </span>
        <span class="action-buttons">
            @if ($editable)
                <form class="form-inline d-inline-block align-top">
                    <div class="input-group input-group-sm" title="Copy this link to share this dataset">
                        <div class="input-group-prepend">
                            <span class="input-group-text">Share:</span>
                        </div>
                        <input type="text" class="form-control share-input" readonly value="{{route('show', $dataset->public_slug)}}">
                    </div>
                </form>
                <form class="form-inline d-inline-block align-top" method="POST" action="{{url("api/datasets/{$dataset->id}")}}" onsubmit="return confirm('Are you sure that you want to delete dataset \'{{$dataset->name}}\'?') && (this.lastElementChild.disabled = true, this.lastElementChild.firstElementChild.style = '', true);">
                    @method('DELETE')
                    @csrf
                    <input type="hidden" name="secret" value="{{$dataset->secret_slug}}">
                    <button type="submit" class="btn btn-danger btn-sm" title="Delete this dataset">
                        <span class="spinner-border spinner-border-sm align-middle mr-1" style="display: none;"></span>
                        Delete
                    </button>
                </form>
            @endif
        </span>
    </nav>
    <div class="main">
        <div class="main-content">
            <visualization
                ref="visualization"
                v-bind:dataset="dataset"
                v-on:hover="updateHoverPixelVector"
                v-on:select="updateSelectPixelVector"
            ></visualization>
        </div>
        <div class="main-aside">
            <pixel-vector-display
                ref="pixelVectorDisplay"
                v-bind:dataset="dataset"
                v-on:hover="updateHoveredFeature"
            ></pixel-vector-display>
        </div>
    </div>
</div>
<script type="text/javascript">
    window.DATASET = {!! $dataset !!};
</script>
@endsection

