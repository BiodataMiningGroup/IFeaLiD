@extends('base')

@section('title', "vis4deep - {$dataset->name}")

@section('content')
<div id="show-container" class="show-container">
    <div class="header">
        <span class="logo"><img src="{{asset('logo.svg')}}"> vis4deep</span>
        <span class="title">{{$dataset->name}}</span>
        <span class="controls">
            <button class="button">share</button>
            <button class="button">delete</button>
        </span>
    </div>
    <div class="main">
        <div class="main-content">
            <div v-if="!ready" class="loading-overlay">
                <loading-indicator :size="120" :progress="loaded"></loading-indicator>
            </div>
            <visualization
                v-bind:handler="handler"
                v-bind:dataset="dataset"
            ></visualization>
        </div>
        <div class="main-aside">

        </div>
    </div>
</div>
<script type="text/javascript">
    window.DATASET = {!! $dataset !!};
</script>
@endsection

