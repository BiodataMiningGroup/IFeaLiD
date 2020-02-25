@extends('base')

@section('content')
Home

{!! Honeypot::generate('website', 'homepage') !!}

@if ($deleted)
<br>Deleted {{$deleted}}
@endif

@endsection
