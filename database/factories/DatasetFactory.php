<?php

/** @var \Illuminate\Database\Eloquent\Factory $factory */

use App\Dataset;
use Faker\Generator as Faker;

$factory->define(Dataset::class, function (Faker $faker) {
    return [
        'name' => $faker->name,
        'width' => $faker->randomNumber,
        'height' => $faker->randomNumber,
        'features' => $faker->randomNumber,
    ];
});
