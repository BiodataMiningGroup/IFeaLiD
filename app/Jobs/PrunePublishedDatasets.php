<?php

namespace App\Jobs;

use Storage;
use App\Dataset;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;

class PrunePublishedDatasets implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        $disk = Storage::disk('public');
        $publishedIds = collect($disk->allDirectories())
            ->map(function ($item) {
                return substr($item, 6);
            })
            ->filter();

        $idsToPrune = Dataset::where('updated_at', '<', Carbon::now()->subDays(2))
            ->whereIn('id', $publishedIds)
            ->pluck('id');

        $idsToPrune->each(function ($id) use ($disk) {
            $disk->deleteDirectory("{$id[0]}{$id[1]}/{$id[2]}{$id[3]}/{$id}");
        });
    }
}
