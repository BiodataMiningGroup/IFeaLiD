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
        config(['app.dataset_prune_age' => 1]);
        $old = factory(Dataset::class)->create([
            'created_at' => Carbon::now()->subWeeks(3),
            'updated_at' => Carbon::now()->subWeeks(2),
        ]);

        $oldPermanent = factory(Dataset::class)->create([
            'created_at' => Carbon::now()->subWeeks(3),
            'updated_at' => Carbon::now()->subWeeks(2),
            'permanent' => true,
        ]);

        $new = factory(Dataset::class)->create();

        $job = new PruneDatasets;
        $job->handle();
        $this->assertFalse(Dataset::whereId($old->id)->exists());
        $this->assertTrue(Dataset::whereId($oldPermanent->id)->exists());
        $this->assertTrue(Dataset::whereId($new->id)->exists());

        $old->refresh();
        $this->assertEquals('', $old->name);
        $this->assertEquals(0, $old->width);
        $this->assertEquals(0, $old->height);
        $this->assertEquals(0, $old->features);
    }
}
