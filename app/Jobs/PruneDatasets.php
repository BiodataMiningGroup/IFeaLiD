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
        Dataset::where('updated_at', '<', Carbon::now()->subWeeks(4))
            ->where('permanent', '=', false)
            ->delete();
    }
}
