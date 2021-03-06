<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', [
    'as' => 'home',
    'uses' => 'DatasetController@create',
]);

Route::post('/api/datasets', 'DatasetController@store');

Route::delete('/api/datasets/{id}', [
    'uses' => 'DatasetController@destroy',
]);

Route::get('/e/{slug}', [
    'as' => 'edit',
    'uses' => 'DatasetController@edit',
    'where' => ['slug' => '[0-9A-Za-z]{10}'],
]);

Route::get('/s/{slug}', [
    'as' => 'show',
    'uses' => 'DatasetController@show',
    'where' => ['slug' => '[0-9A-Za-z]{10}'],
]);
