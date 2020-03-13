<?php

namespace Tests\Unit\Jobs;

use Storage;
use App\Dataset;
use Carbon\Carbon;
use Tests\TestCase;
use Illuminate\Http\UploadedFile;
use App\Jobs\PrunePublishedDatasets;

class PrunePublishedDatasetsTest extends TestCase
{
    public function testHandle()
    {
        $local = Storage::fake();
        $public = Storage::fake('public');
        $file = new UploadedFile(__DIR__.'/../../files/dataset.zip', 'dataset.zip', 'application/zip', null, true);
        $old = factory(Dataset::class)->create([
            'created_at' => Carbon::now()->subWeek(),
            'updated_at' => Carbon::now()->subDays(3),
        ]);
        $old->storeZip($file);
        $old->publishZip();

        $new = factory(Dataset::class)->create();
        $new->storeZip($file);
        $new->publishZip();

        $this->assertTrue($public->exists("{$old->id[0]}{$old->id[1]}/{$old->id[2]}{$old->id[3]}/{$old->id}"));
        $this->assertTrue($public->exists("{$new->id[0]}{$new->id[1]}/{$new->id[2]}{$new->id[3]}/{$new->id}"));

        $job = new PrunePublishedDatasets;
        $job->handle();

        $this->assertFalse($public->exists("{$old->id[0]}{$old->id[1]}/{$old->id[2]}{$old->id[3]}/{$old->id}"));
        $this->assertTrue($public->exists("{$new->id[0]}{$new->id[1]}/{$new->id[2]}{$new->id[3]}/{$new->id}"));
    }
}
