<?php

namespace Tests\Unit\Jobs;

use App\Dataset;
use Carbon\Carbon;
use Tests\TestCase;
use App\Jobs\PruneDatasets;

class PruneDatasetsTest extends TestCase
{
    public function testHandle()
    {
        $old = factory(Dataset::class)->create([
            'created_at' => Carbon::now()->subWeeks(6),
            'updated_at' => Carbon::now()->subWeeks(5),
        ]);

        $oldPermanent = factory(Dataset::class)->create([
            'created_at' => Carbon::now()->subWeeks(6),
            'updated_at' => Carbon::now()->subWeeks(5),
            'permanent' => true,
        ]);

        $new = factory(Dataset::class)->create();

        $job = new PruneDatasets;
        $job->handle();
        $this->assertFalse(Dataset::whereId($old->id)->exists());
        $this->assertTrue(Dataset::whereId($oldPermanent->id)->exists());
        $this->assertTrue(Dataset::whereId($new->id)->exists());
    }
}
