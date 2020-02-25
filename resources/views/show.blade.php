@extends('base')

@section('title', "vis4deep - {$dataset->name}")

@section('content')
<div class="show-container">
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

        </div>
        <div class="main-aside">

        </div>
    </div>
</div>
@endsection
