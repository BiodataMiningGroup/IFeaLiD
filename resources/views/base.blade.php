<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>@yield('title', config('app.name'))</title>
        <meta name="description" content="An interactive tool for the exploration of multivariate deep neural network features.">
        <link rel="stylesheet" href="{{ asset('css/app.css') }}">
        <link rel="icon" type="image/svg" href="{{ asset('logo.svg') }}">
    </head>
    <body class="bg-dark">
        @yield('content')
        <script type="text/javascript" src="{{asset('js/app.js')}}"></script>
        <script type="text/javascript">
            Vue.http.options.root = '{{url('/')}}';
            Vue.http.headers.common['X-CSRF-TOKEN'] = '{{csrf_token()}}';
        </script>
        @stack('scripts')
    </body>
</html>
