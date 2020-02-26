<?php

namespace Tests\Feature;

use Storage;
use Honeypot;
use App\Dataset;
use Tests\TestCase;
use Illuminate\Http\UploadedFile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;

class DatasetControllerTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(ThrottleRequests::class);
    }

    public function testCreate()
    {
        $this->get('/')->assertStatus(200);
    }

    public function testStoreHoneypot()
    {
        $local = Storage::fake('local');
        $public = Storage::fake('public');
        $this->assertEquals(0, Dataset::count());

        $file = $this->getFile('dataset.zip');
        $this->postJson("/api/datasets", ['file' => $file])->assertStatus(422);
    }

    public function testStore()
    {
        Honeypot::disable();
        $local = Storage::fake('local');
        $public = Storage::fake('public');
        $this->assertEquals(0, Dataset::count());

        $file = $this->getFile('dataset.zip');
        $response = $this->post("/api/datasets", [
            'file' => $file,
            'homepage' => 'random',
        ]);

        $d = Dataset::first();
        $this->assertNotNull($d);
        $response->assertRedirect("e/{$d->secret_slug}");
        $this->assertEquals('Test dataset', $d->name);
        $this->assertEquals(1024, $d->width);
        $this->assertEquals(684, $d->height);
        $this->assertEquals(4, $d->features);

        $this->assertTrue($local->exists("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}.zip"));
        $this->assertTrue($public->exists("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}/0.png"));
    }

    public function testStoreValidateZipFileNumFiles()
    {
        $file = UploadedFile::fake()->create('dataset.zip', 1000, 'application/zip');
        $this->postJson("/api/datasets", ['file' => $file])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileNoMeta()
    {
        $file = $this->getFile('dataset_no_meta.zip');
        $this->postJson("/api/datasets", ['file' => $file])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileMalformedMeta()
    {
        $file = $this->getFile('dataset_malformed_meta.zip');
        $this->postJson("/api/datasets", ['file' => $file])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileInvalidMeta()
    {
        $file = $this->getFile('dataset_invalid_meta.zip');
        $this->postJson("/api/datasets", ['file' => $file])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileMismatchFiles()
    {
        $file = $this->getFile('dataset_mismatch_files.zip');
        $this->postJson("/api/datasets", ['file' => $file])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileForeignFiles()
    {
        $file = $this->getFile('dataset_foreign_files.zip');
        $this->postJson("/api/datasets", ['file' => $file])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileTotalSize()
    {
        $file = $this->getFile('dataset_401mb.zip');
        $this->postJson("/api/datasets", ['file' => $file])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileMismatchSize()
    {
        $file = $this->getFile('dataset_mismatch_size.zip');
        $this->postJson("/api/datasets", ['file' => $file])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileLargeFeatures()
    {
        $file = $this->getFile('dataset_large_features.zip');
        $this->postJson("/api/datasets", ['file' => $file])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileLargeImage()
    {
        $file = $this->getFile('dataset_large_image.zip');
        $this->postJson("/api/datasets", ['file' => $file])
            ->assertStatus(422);
    }

    public function testEdit()
    {
        Storage::fake('local');
        $disk = Storage::fake('public');
        $file = $this->getFile('dataset.zip');
        $d = factory(Dataset::class)->create();
        $d->storeZip($file);

        $this->get("/e/{$d->public_slug}")->assertStatus(404);
        $this->get("/e/{$d->secret_slug}")->assertStatus(200)->assertViewIs('show');
        $this->assertTrue($disk->exists("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}/0.png"));
    }

    public function testShow()
    {
        Storage::fake('local');
        $disk = Storage::fake('public');
        $file = $this->getFile('dataset.zip');
        $d = factory(Dataset::class)->create();
        $d->storeZip($file);

        $this->get("/s/{$d->secret_slug}")->assertStatus(404);
        $this->get("/s/{$d->public_slug}")->assertStatus(200)->assertViewIs('show');
        $this->assertTrue($disk->exists("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}/0.png"));
    }

    public function testDestroy()
    {
        $d = factory(Dataset::class)->create();
        $this->delete("/api/datasets/{$d->id}")->assertStatus(403);
        $this->deleteJson("/api/datasets/{$d->id}", ['secret' => $d->secret_slug])
            ->assertRedirect('/')
            ->assertSessionHas('deleted', $d->name);

        $this->assertNull($d->fresh());
    }

    protected function getFile($name)
    {
        $filesDirectory = __DIR__.'/../files';

        return new UploadedFile("{$filesDirectory}/{$name}", $name, 'application/zip', null, true);
    }
}
