<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>@yield('title', 'RTMFE')</title>
        <meta name="description" content="An interactive tool for the visualization of multivariate deep neural network activations.">
        <link rel="stylesheet" href="{{ asset('css/app.css') }}">
        <link rel="icon" type="image/svg" href="{{ asset('logo.svg') }}">
    </head>
    <body>
        @yield('content')
    </body>
</html>
