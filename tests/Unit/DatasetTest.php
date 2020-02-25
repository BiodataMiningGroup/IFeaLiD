<?php

namespace Tests\Unit;

use Storage;
use App\Dataset;
use Tests\TestCase;
use Illuminate\Http\UploadedFile;

class DatasetTest extends TestCase
{
    public function testColumns()
    {
        $d = factory(Dataset::class)->create();
        $this->assertNotNull($d->id);
        $this->assertNotNull($d->public_slug);
        $this->assertNotNull($d->secret_slug);
        $this->assertNotNull($d->created_at);
        $this->assertNotNull($d->updated_at);
        $this->assertNotNull($d->name);
        $this->assertNotNull($d->width);
        $this->assertNotNull($d->height);
        $this->assertNotNull($d->features);
    }

    public function testHiddenAttributes()
    {
        $d = factory(Dataset::class)->create();
        $this->assertArrayNotHasKey('secret_slug', $d->toArray());
    }

    public function testStoreZip()
    {
        $disk = Storage::fake('local');
        $file = UploadedFile::fake()->create('dataset.zip');
        $d = factory(Dataset::class)->create();
        $d->storeZip($file);
        $this->assertTrue($disk->exists("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}.zip"));
    }

    public function testPublishZip()
    {
        $local = Storage::fake('local');
        $public = Storage::fake('public');
        $file = new UploadedFile(__DIR__.'/../files/dataset.zip', 'dataset.zip', 'application/zip', null, true);
        $d = factory(Dataset::class)->create();
        $d->storeZip($file);
        $d->publishZip();
        $this->assertTrue($public->exists("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}"));
        $this->assertTrue($public->exists("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}/0.png"));
    }

    public function testPublishZipFromFile()
    {
        $public = Storage::fake('public');
        $file = new UploadedFile(__DIR__.'/../files/dataset.zip', 'dataset.zip', 'application/zip', null, true);
        $d = factory(Dataset::class)->create();
        $d->publishZip($file);
        $this->assertTrue($public->exists("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}"));
        $this->assertTrue($public->exists("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}/0.png"));
    }
}
