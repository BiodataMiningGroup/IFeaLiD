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
        'precision' => $faker->randomElement([8, 16, 32]),
        'overlay' => $faker->boolean,
        'permanent' => false,
    ];
});
