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
            // The dataset is soft deleted so the ID and slugs can never be reused but
            // we don't want to permanently store the following attributes.
            $dataset->update([
                'name' => '',
                'width' => 0,
                'height' => 0,
                'features' => 0,
            ]);
        });
    }
}
