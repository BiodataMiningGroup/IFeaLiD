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
            <visualization
                ref="visualization"
                v-bind:dataset="dataset"
                v-on:select="updatePixelVector"
            ></visualization>
        </div>
        <div class="main-aside">
            <intensity-list
                ref="intensityList"
                v-bind:dataset="dataset"
            ></intensity-list>
        </div>
    </div>
</div>
<script type="text/javascript">
    window.DATASET = {!! $dataset !!};
</script>
@endsection

