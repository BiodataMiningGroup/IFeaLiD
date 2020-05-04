<?php

namespace App\Jobs;

use App\Dataset;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;

class PruneDatasets implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $age = intval(config('app.dataset_prune_age'));
        Dataset::where('updated_at', '<', Carbon::now()->subWeeks($age))
            ->where('permanent', '=', false)
            ->delete();
    }
}
