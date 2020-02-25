<?php

namespace App\Providers;

use Str;
use App\Dataset;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        Dataset::creating(function ($dataset) {
            $dataset->id = Str::uuid()->toString();
            $dataset->public_slug = Str::random(10);
            $dataset->secret_slug = Str::random(10);
        });

        Dataset::deleted(function ($dataset) {
            $dataset->deleteZip();
            $dataset->deletePublishedFiles();
        });
    }
}
