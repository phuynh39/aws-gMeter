#!/bin/bash

set -e

# Get reference for all important folders
template_dir="$PWD"
build_dist_dir="$template_dir/build-dist"
source_dir="$template_dir/../source"


echo "------------------------------------------------------------------------------"
echo "Rebuild distribution"
echo "------------------------------------------------------------------------------"
rm -rf $build_dist_dir
mkdir -p $build_dist_dir

cd $source_dir

echo "------------------------------------------------------------------------------"
echo "Creating custom-resource deployment package"
echo "------------------------------------------------------------------------------"
cd custom-resource/
rm -rf node_modules/
npm install --production
rm package-lock.json
zip -q -r9 $build_dist_dir/custom-resource.zip *

echo "------------------------------------------------------------------------------"
echo "Creating api-services deployment package"
echo "------------------------------------------------------------------------------"
cd ../api-services
rm -rf node_modules/
npm install --production
rm package-lock.json
zip -q -r9 $build_dist_dir/api-services.zip *

echo "------------------------------------------------------------------------------"
echo "Creating results-parser deployment package"
echo "------------------------------------------------------------------------------"
cd ../results-parser
rm -rf node_modules/
npm install --production
rm package-lock.json
zip -q -r9 $build_dist_dir/results-parser.zip *

echo "------------------------------------------------------------------------------"
echo "Creating task-runner deployment package"
echo "------------------------------------------------------------------------------"
cd ../task-runner
rm -rf node_modules/
npm install --production
rm package-lock.json
zip -q -r9 $build_dist_dir/task-runner.zip *

echo "------------------------------------------------------------------------------"
echo "Building console"
echo "------------------------------------------------------------------------------"
cd ../console
[ -e build ] && rm -rf build
[ -e node_modules ] && rm -rf node_modules
npm install
touch public/aws_config.js
npm run build
mkdir $build_dist_dir/console
cp -r ./build/* $build_dist_dir/console/

echo "------------------------------------------------------------------------------"
echo "Generate console manifest file"
echo "------------------------------------------------------------------------------"
cd $build_dist_dir
manifest=(`find console -type f | sed 's|^./||'`)
manifest_json=$(IFS=,;printf "%s" "${manifest[*]}")
echo "[\"$manifest_json\"]" | sed 's/,/","/g' > ./console-manifest.json

echo "------------------------------------------------------------------------------"
echo "Build S3 Packaging Complete"
echo "------------------------------------------------------------------------------"
