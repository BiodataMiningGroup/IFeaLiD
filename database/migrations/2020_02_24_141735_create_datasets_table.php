<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDatasetsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('datasets', function (Blueprint $table) {
            $table->uuid('id')->unique()->index();
            $table->string('public_slug', 10)->unique()->index();
            $table->string('secret_slug', 10)->unique()->index();
            $table->timestamps();
            $table->string('name');
            $table->integer('width');
            $table->integer('height');
            $table->integer('features');
            $table->enum('precision', [8, 16, 32]);
            $table->boolean('overlay');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('datasets');
    }
}
