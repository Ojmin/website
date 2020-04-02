$(function(){
  let comCanvas = document.getElementById('comCanvas')
    // 渲染完执行的函数
    /**
     * 创建场景对象Scene
     */
    let scene = new THREE.Scene();
    let camera = null;
    let renderer = null;
    let composer = null;
    let mat = null;
    let geo = null;
    let outlinePass = null;

    /**
     * 光源设置
     */
    // 环境光
    let ambient = new THREE.AmbientLight(0xffffff);
    ambient.intensity = 1;
    let direction = new THREE.DirectionalLight(0x555555);
    direction.position.set(1.35, 0.93, 0.17);
    scene.add(direction);
    // 颜色、光照强度（默认为1）、光源到光照强度为0的位置(默认为0)、沿着光照距离的衰减量（默认值为1）
    let point1 = new THREE.PointLight(0x808080, 1, 0.2, 0.5);
    point1.position.set(0.03, -0.02, 0.18);
    scene.add(point1);
    let point2 = new THREE.PointLight(0xaaaaaa, 1, 0.3);
    point2.position.set(-0.04, 0.07, -0.26);
    scene.add(point2);
    var canvasW = 850;
    var canvasH = 396;
    /**
     * 相机设置:透视投影
     */
    camera = new THREE.PerspectiveCamera(45, canvasW / canvasH, 0.1, 10000);
    camera.position.set(0, 0, 0.8);
    camera.lookAt(scene.position);
    /**
     * 创建渲染器对象
     */
    renderer = new THREE.WebGLRenderer({canvas: comCanvas, antialias: true,alpha:true});
    renderer.setSize(canvasW , canvasH);
    renderer.setClearColor(0xff0000, 0);// 设置背景颜色
 
    renderer.gammaInput = true;// 输出时打开gamma
    renderer.gammaOutput = true;// 输出时打开gamma

    let dp = 1;
    let devicePixelRatio = window.devicePixelRatio;
    if (devicePixelRatio != undefined) {
      dp = devicePixelRatio;
    }
    renderer.setPixelRatio(dp);

    // 效果组合器，是一个可以将结果输出到屏幕上的通道
    composer = new THREE.EffectComposer(renderer);
    // 原始场景渲染结果,会渲染场景，但不会将渲染结果输出到屏幕上
    let renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);
    outlinePass = new THREE.OutlinePass(new THREE.Vector2(canvasW / canvasH), scene, camera);
    composer.addPass(outlinePass);
    // FXAAShader是添加抗锯齿锯齿的效果
    let effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
    effectFXAA.uniforms['resolution'].value.set(1 /canvasW, 1 /canvasH);
    effectFXAA.renderToScreen = true;
    composer.addPass(effectFXAA);
    // bleachBypassShader是添加镀银的效果
    // let bleachBypassShader = new THREE.ShaderPass(THREE.BleachBypassShader);
    // bleachBypassShader.renderToScreen = true;
    // composer.addPass(bleachBypassShader);

    // let effectCopy = new THREE.ShaderPass(THREE.CopyShader);
    // effectCopy.render = true;//将场景输出
    // composer.addPass(effectCopy);

    let mesh;
    let textureLoader = new THREE.TextureLoader();

    let loader = new THREE.ColladaLoader();

    loader.load('static/themeshoe.DAE', (result) => {
      geo = result.scene.children[1].geometry.clone();

      textureLoader.load('static/env1.jpg', (res) => {
        res.encoding = THREE.sRGBEncoding;
        let cubemapGenerator = new THREE.EquirectangularToCubeGenerator(res, {resolution: 512});
        let cubeMapTexture = cubemapGenerator.update(renderer);
        let pmremGenerator = new THREE.PMREMGenerator(cubeMapTexture);
        pmremGenerator.update(renderer);
        let pmremCubeUVPacker = new THREE.PMREMCubeUVPacker(pmremGenerator.cubeLods);
        pmremCubeUVPacker.update(renderer);
        let cube = pmremCubeUVPacker.CubeUVRenderTarget;
        res.dispose();
        pmremGenerator.dispose();
        pmremCubeUVPacker.dispose();
        textureLoader.load('static/map1.jpg', (mapres) => {
        mat = new THREE.MeshPhysicalMaterial({
            map: mapres,
            envMap: cube.texture,
            needsUpdate: true,
            roughness: 0.39,
            metalness: 1.0,
            // clearCoat: 1.0,
            // clearCoatRoughness: 1.0,
            reflectivity: 1.0,
            envMapIntensity: 0.65
          });
          mesh = new THREE.Mesh(
            geo,
            mat
          );
          outlinePass.selectedObjects = [mesh];
          outlinePass.edgeStrength = 2;// 强度
          outlinePass.edgeGlow = 0.3;// 强度
          outlinePass.edgeThickness = 4;// 边缘浓度
          outlinePass.pulsePeriod = 5;// 闪烁频率，值越大，频率越低
          outlinePass.visibleEdgeColor.set(0x555555);
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.set(0, -0.16, 0);
          mesh.scale.set(4,4,4);
          mesh.name = 'root';
          scene.add(mesh);
        });
      });

      comCanvas.style.width = '100%'
      comCanvas.style.height = '100%'
    });
    
  function render() {
    composer.render();
    scene.traverse((e) => {
      if (e.name === 'root') {
        e.rotation.z += 0.01;
      }
    });
    requestAnimationFrame(render); // 请求再次执行渲染函数render，渲染下一帧
  }
  render();
})
    

