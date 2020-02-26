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
        $array = factory(Dataset::class)->create()->toArray();
        $this->assertArrayNotHasKey('secret_slug', $array);
        $this->assertArrayNotHasKey('created_at', $array);
        $this->assertArrayNotHasKey('updated_at', $array);
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

    public function testDeleteZip()
    {
        $disk = Storage::fake('local');
        $d = factory(Dataset::class)->create();
        $disk->put("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}.zip", '0');
        $d->deleteZip();
        $this->assertFalse($disk->exists("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}.zip"));
    }

    public function testDeletePublishedFiles()
    {
        $disk = Storage::fake('public');
        $d = factory(Dataset::class)->create();
        $disk->put("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}/0.png", '0');
        $d->deletePublishedFiles();
        $this->assertFalse($disk->exists("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}"));
    }

    public function testDelete()
    {
        $local = Storage::fake('local');
        $public = Storage::fake('public');
        $d = factory(Dataset::class)->create();
        $local->put("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}.zip", '0');
        $public->put("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}/0.png", '0');
        $d->delete();
        $this->assertFalse($local->exists("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}.zip"));
        $this->assertFalse($public->exists("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}"));
    }

    public function testWithUrl()
    {
        $d = factory(Dataset::class)->create();
        $this->assertNull($d->url);
        $d->withUrl();
        $this->assertNotNull($d->url);
    }
}
