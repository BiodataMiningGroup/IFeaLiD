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
        Honeypot::disable();
    }

    public function testCreate()
    {
        $this->get('/')->assertStatus(200);
    }

    public function testStoreHoneypot()
    {
        Honeypot::enable();
        $local = Storage::fake();
        $public = Storage::fake('public');
        $this->assertEquals(0, Dataset::count());

        $file = $this->getFile('dataset.zip');
        $this->postJson("/api/datasets", ['file' => $file])->assertStatus(422);
    }

    public function testStore()
    {
        $local = Storage::fake();
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
        $this->assertEquals(8, $d->precision);
        $this->assertTrue($d->overlay);

        $this->assertTrue($local->exists("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}.zip"));
        $this->assertTrue($public->exists("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}/0.png"));
    }

    public function testStoreFailStorage()
    {
        Storage::shouldReceive('putFileAs')->andThrow(new \Exception);

        $file = $this->getFile('dataset.zip');
        $this->postJson("/api/datasets", [
                'file' => $file,
                'homepage' => 'random',
            ])
            ->assertStatus(500);

        $this->assertEquals(0, Dataset::withTrashed()->count());
    }

    public function testStore16bit()
    {
        $local = Storage::fake();
        $public = Storage::fake('public');
        $this->assertEquals(0, Dataset::count());

        $file = $this->getFile('dataset_16bit.zip');
        $response = $this->post("/api/datasets", [
            'file' => $file,
            'homepage' => 'random',
        ]);

        $d = Dataset::first();
        $this->assertNotNull($d);
        $response->assertRedirect("e/{$d->secret_slug}");
        $this->assertEquals(4, $d->features);
        $this->assertEquals(16, $d->precision);
    }

    public function testStore32bit()
    {
        $local = Storage::fake();
        $public = Storage::fake('public');
        $this->assertEquals(0, Dataset::count());

        $file = $this->getFile('dataset_32bit.zip');
        $response = $this->post("/api/datasets", [
            'file' => $file,
            'homepage' => 'random',
        ]);

        $d = Dataset::first();
        $this->assertNotNull($d);
        $response->assertRedirect("e/{$d->secret_slug}");
        $this->assertEquals(2, $d->features);
        $this->assertEquals(32, $d->precision);
    }

    public function testStoreValidateZipFileNumFiles()
    {
        $file = UploadedFile::fake()->create('dataset.zip', 1000, 'application/zip');
        $this->postJson("/api/datasets", [
                'file' => $file,
                'homepage' => 'random',
            ])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileNoMeta()
    {
        $file = $this->getFile('dataset_no_meta.zip');
        $this->postJson("/api/datasets", [
                'file' => $file,
                'homepage' => 'random',
            ])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileMalformedMeta()
    {
        $file = $this->getFile('dataset_malformed_meta.zip');
        $this->postJson("/api/datasets", [
                'file' => $file,
                'homepage' => 'random',
            ])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileInvalidMeta()
    {
        $file = $this->getFile('dataset_invalid_meta.zip');
        $this->postJson("/api/datasets", [
                'file' => $file,
                'homepage' => 'random',
            ])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileMismatchFiles()
    {
        $file = $this->getFile('dataset_mismatch_files.zip');
        $this->postJson("/api/datasets", [
                'file' => $file,
                'homepage' => 'random',
            ])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileForeignFiles()
    {
        $file = $this->getFile('dataset_foreign_files.zip');
        $this->postJson("/api/datasets", [
                'file' => $file,
                'homepage' => 'random',
            ])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileTotalSize()
    {
        $file = $this->getFile('dataset_401mb.zip');
        $this->postJson("/api/datasets", [
                'file' => $file,
                'homepage' => 'random',
            ])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileMismatchSize()
    {
        $file = $this->getFile('dataset_mismatch_size.zip');
        $this->postJson("/api/datasets", [
                'file' => $file,
                'homepage' => 'random',
            ])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileLargeFeatures()
    {
        $file = $this->getFile('dataset_large_features.zip');
        $this->postJson("/api/datasets", [
                'file' => $file,
                'homepage' => 'random',
            ])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileLargeImage()
    {
        $file = $this->getFile('dataset_large_image.zip');
        $this->postJson("/api/datasets", [
                'file' => $file,
                'homepage' => 'random',
            ])
            ->assertStatus(422);
    }

    public function testStoreValidateZipFileInvalidOverlay()
    {
        $file = $this->getFile('dataset_invalid_overlay.zip');
        $this->postJson("/api/datasets", [
                'file' => $file,
                'homepage' => 'random',
            ])
            ->assertStatus(422);
    }

    public function testEdit()
    {
        Storage::fake();
        $disk = Storage::fake('public');
        $file = $this->getFile('dataset.zip');
        $d = factory(Dataset::class)->create();
        $d->storeZip($file);

        $this->get("/e/{$d->public_slug}")->assertStatus(404);
        $this->get("/e/{$d->secret_slug}")->assertStatus(200)->assertViewIs('show');
        $this->assertTrue($disk->exists("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}/0.png"));
    }

    public function testEditSoftDelete()
    {
        $d = factory(Dataset::class)->create();
        $d->delete();

        $this->get("/e/{$d->secret_slug}")->assertStatus(404);
    }

    public function testShow()
    {
        Storage::fake();
        $disk = Storage::fake('public');
        $file = $this->getFile('dataset.zip');
        $d = factory(Dataset::class)->create();
        $d->storeZip($file);

        $this->get("/s/{$d->secret_slug}")->assertStatus(404);
        $this->get("/s/{$d->public_slug}")->assertStatus(200)->assertViewIs('show');
        $this->assertTrue($disk->exists("{$d->id[0]}{$d->id[1]}/{$d->id[2]}{$d->id[3]}/{$d->id}/0.png"));
    }

    public function testShowSoftDelete()
    {
        $d = factory(Dataset::class)->create();
        $d->delete();

        $this->get("/s/{$d->public_slug}")->assertStatus(404);
    }

    public function testDestroy()
    {
        $d = factory(Dataset::class)->create();
        $this->delete("/api/datasets/{$d->id}")->assertStatus(403);
        $this->deleteJson("/api/datasets/{$d->id}", ['secret' => $d->secret_slug])
            ->assertRedirect('/')
            ->assertSessionHas('deleted', $d->name);

        $this->assertNull(Dataset::find($d->id));
    }

    protected function getFile($name)
    {
        $filesDirectory = __DIR__.'/../files';

        return new UploadedFile("{$filesDirectory}/{$name}", $name, 'application/zip', null, true);
    }
}
