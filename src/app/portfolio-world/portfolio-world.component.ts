import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import {
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Clock,
  ConeGeometry,
  Color,
  CylinderGeometry,
  BackSide,
  DoubleSide,
  DirectionalLight,
  FogExp2,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OrthographicCamera,
  PCFSoftShadowMap,
  PlaneGeometry,
  PointLight,
  RingGeometry,
  RepeatWrapping,
  Scene,
  SphereGeometry,
  TorusGeometry,
  Object3D,
  Vector3,
  WebGLRenderer
} from 'three';

type PortfolioSection = {
  id: string;
  title: string;
  subtitle: string;
  highlights: string[];
  actions?: SectionAction[];
  contactLinks?: ContactLink[];
  projectGroups?: ProjectGroup[];
  skillGroups?: SkillGroup[];
  accentColor: string;
};

type SectionAction = {
  label: string;
  href: string;
  download?: boolean;
};

type ContactLink = {
  label: string;
  icon: 'email' | 'github' | 'linkedin';
  href: string;
};

type ProjectGroup = {
  name: string;
  summary: string;
  projects: ProjectThumbnail[];
};

type ProjectThumbnail = {
  title: string;
  href: string;
  thumbnailLabel: string;
  thumbnailUrl?: string;
};

type SkillGroup = {
  name: string;
  items: SkillItem[];
};

type SkillItem = {
  name: string;
  icon: 'typescript' | 'javascript' | 'dotnet' | 'sql' | 'angular' | 'bootstrap' | 'jasmine' | 'html' | 'css' | 'cypress' | 'unity' | 'godot' | 'aseprite' | 'audacity';
  logo?: string;
};

type SectionStone = {
  section: PortfolioSection;
  position: Vector3;
  mesh: Mesh;
};

type SectionHologram = {
  sectionId: string;
  group: Group;
  symbolPivot: Group;
  symbolMaterials: MeshBasicMaterial[];
  symbolTextures: CanvasTexture[];
  beam: Mesh;
  ring: Mesh;
  groundAura: Mesh;
  sparkles: Mesh[];
  phase: number;
};

type Butterfly = {
  group: Group;
  leftWing: Mesh;
  rightWing: Mesh;
  phase: number;
  radius: number;
  speed: number;
  center: Vector3;
};

type Bird = {
  group: Group;
  leftWing: Mesh;
  rightWing: Mesh;
  heading: Vector3;
  speed: number;
  phase: number;
};

type FloatingParticle = {
  mesh: Mesh;
  phase: number;
  drift: Vector3;
  baseY: number;
};

type GrassTuft = {
  group: Group;
  phase: number;
};

type FountainJet = {
  mesh: Mesh;
  baseY: number;
  baseHeight: number;
  phase: number;
};

type GamingNpc = {
  group: Group;
  leftArmPivot: Group;
  rightArmPivot: Group;
  leftLegPivot: Group;
  rightLegPivot: Group;
  torso: Object3D;
  head: Object3D;
  screenMaterial: MeshBasicMaterial;
  phase: number;
};

type HandballNpc = {
  group: Group;
  leftArmPivot: Group;
  rightArmPivot: Group;
  leftLegPivot: Group;
  rightLegPivot: Group;
  torso: Object3D;
  head: Object3D;
};

type HandballScene = {
  center: Vector3;
  shooter: HandballNpc;
  goalkeeper: HandballNpc;
  ball: Mesh;
  netMaterials: MeshBasicMaterial[];
  shooterStart: Vector3;
  goalkeeperBase: Vector3;
  goalCenterX: number;
  goalLineZ: number;
  phase: number;
  cycleDuration: number;
  shotDirection: number;
  shotHeight: number;
  shotScored: boolean;
  shotArc: number;
};

type ForestPlaqueTrigger = {
  position: Vector3;
  sectionId: string;
  panelSection: PortfolioSection;
  triggerRadius: number;
  standOutline: Mesh;
  plateOutline: Mesh;
  phase: number;
};

@Component({
  selector: 'app-portfolio-world',
  templateUrl: './portfolio-world.component.html',
  styleUrls: ['./portfolio-world.component.css'],
  standalone: false
})
export class PortfolioWorldComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sceneContainer', { static: true }) sceneContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('touchJoystick') touchJoystick?: ElementRef<HTMLDivElement>;

  private scene!: Scene;
  private camera!: OrthographicCamera;
  private renderer!: WebGLRenderer;
  private player!: Group;
  private characterGroup!: Group;
  private leftArmPivot!: Group;
  private rightArmPivot!: Group;
  private leftLegPivot!: Group;
  private rightLegPivot!: Group;
  private floorTexture?: CanvasTexture;
  private wallTexture?: CanvasTexture;
  private dirtPathTexture?: CanvasTexture;
  private roadPathTexture?: CanvasTexture;
  private stoneSurfaceTexture?: CanvasTexture;
  private animationFrameId?: number;
  private resizeRetryFrameId?: number;
  private readonly clock = new Clock();
  private readonly keys = new Set<string>();
  private readonly cameraOffset = new Vector3(20, 20, 20);
  private readonly followLookHeight = 0.8;
  private readonly followCameraZoom = 1;
  private readonly cameraFollowPosition = new Vector3();
  private readonly cameraFollowLookTarget = new Vector3();
  private readonly joystickInput = new Vector3();
  private joystickPointerId?: number;
  private isTouchJoystickActive = false;
  private readonly worldViewSize = 30;
  private readonly worldSize = 82;
  private readonly worldUnderlaySize = 240;
  private readonly playerRadius = 0.9;
  private readonly stoneTriggerRadius = 3.1;
  private readonly playerSpeed = 9;
  private readonly characterGroundOffset = 0.74;
  private readonly playerGroundClearance = 0.045;
  private readonly patioRoadSurfaceHeight = 0.058;
  private readonly upVector = new Vector3(0, 1, 0);
  private readonly sectionStones: SectionStone[] = [];
  private readonly sectionHolograms: SectionHologram[] = [];
  private patioRadius = 14.8;
  private readonly butterflies: Butterfly[] = [];
  private readonly birds: Bird[] = [];
  private readonly floatingParticles: FloatingParticle[] = [];
  private readonly grassTufts: GrassTuft[] = [];
  private readonly forestGamingPatioCenter = new Vector3(-24.5, 0, -24.5);
  private readonly forestPlaquePatioCenter = new Vector3(24.5, 0, -24.5);
  private readonly forestDjPatioCenter = new Vector3(24.5, 0, 24.5);
  private readonly forestSocialPatioCenter = new Vector3(-24.5, 0, 24.5);
  private gamingNpc?: GamingNpc;
  private djNpc?: GamingNpc;
  private handballScene?: HandballScene;
  private readonly socialCircleNpcs: Array<{
    npc: HandballNpc;
    phase: number;
    talkSpeed: number;
    baseYaw: number;
    baseLeftArmX: number;
    baseRightArmX: number;
    emphasis: number;
    baseY: number;
    speakingBias: number;
  }> = [];
  private readonly forestPlaqueTriggers: ForestPlaqueTrigger[] = [];
  private fountainWaterSurface?: Mesh;
  private readonly fountainJets: FountainJet[] = [];
  private readonly fountainRipples: Mesh[] = [];
  private fountainElapsed = 0;
  private readonly sections: PortfolioSection[] = [
    {
      id: 'about',
      title: 'About Me',
      subtitle: 'Frontend web developer by profession. Game developer by hobby.',
      highlights: [
        'I build clean and responsive interfaces focused on usability and speed.',
        'Game projects help me sharpen interaction design and product thinking.',
        'I care about maintainable code, performance, and visual polish.'
      ],
      accentColor: '#4f86f7'
    },
    {
      id: 'cv',
      title: 'CV',
      subtitle: '',
      highlights: [],
      actions: [
        {
          label: 'Download CV',
          href: '/assets/CV.pdf',
          download: true
        }
      ],
      accentColor: '#6c74d9'
    },
    {
      id: 'portfolio',
      title: 'Portfolio',
      subtitle: '',
      highlights: [],
      projectGroups: [
        {
          name: 'Web Projects',
          summary: '',
          projects: [
            {
              title: 'Rita Goncalves Portfolio',
              href: 'https://rita-goncalves.web.app/',
              thumbnailLabel: 'RITA',
              thumbnailUrl: 'assets/thumbnail-rita.png'
            },
            {
              title: 'Personal Website (This Project)',
              href: '/',
              thumbnailLabel: 'PERSONAL WEBSITE',
              thumbnailUrl: 'assets/thumbnail-personal-website.png'
            }
          ]
        },
        {
          name: 'Game Projects',
          summary: '',
          projects: [
            {
              title: 'Magal Warrior',
              href: 'https://gazellemag.itch.io/magal-warrior',
              thumbnailLabel: 'MAGAL WARRIOR',
              thumbnailUrl: 'assets/thumbnail-magal-warrior.png'
            }
          ]
        }
      ],
      accentColor: '#2e9f8c'
    },
    {
      id: 'skills',
      title: 'Skills',
      subtitle: '',
      highlights: [],
      skillGroups: [
        {
          name: 'Web Technologies',
          items: [
            { name: 'TypeScript', icon: 'typescript', logo: 'https://cdn.simpleicons.org/typescript/3178C6' },
            { name: 'JavaScript', icon: 'javascript', logo: 'https://cdn.simpleicons.org/javascript/F7DF1E' },
            { name: '.NET', icon: 'dotnet', logo: 'https://cdn.simpleicons.org/dotnet/512BD4' },
            { name: 'SQL', icon: 'sql' },
            { name: 'Angular', icon: 'angular', logo: 'https://cdn.simpleicons.org/angular/DD0031' },
            { name: 'Bootstrap', icon: 'bootstrap', logo: 'https://cdn.simpleicons.org/bootstrap/7952B3' },
            { name: 'Jasmine', icon: 'jasmine', logo: 'https://cdn.simpleicons.org/jasmine/8A4182' },
            { name: 'HTML', icon: 'html', logo: 'https://cdn.simpleicons.org/html5/E34F26' },
            { name: 'CSS', icon: 'css', logo: 'https://cdn.simpleicons.org/css/1572B6' },
            { name: 'Cypress', icon: 'cypress', logo: 'https://cdn.simpleicons.org/cypress/69D3A7' }
          ]
        },
        {
          name: 'Game Technologies',
          items: [
            { name: 'Unity', icon: 'unity', logo: 'https://cdn.simpleicons.org/unity/FFFFFF' },
            { name: 'Godot', icon: 'godot', logo: 'https://cdn.simpleicons.org/godotengine/478CBF' },
            { name: 'Aseprite', icon: 'aseprite', logo: 'https://cdn.simpleicons.org/aseprite/7D929E' },
            { name: 'Audacity', icon: 'audacity', logo: 'https://cdn.simpleicons.org/audacity/0000CC' }
          ]
        }
      ],
      accentColor: '#e07a4f'
    },
    {
      id: 'contact',
      title: 'Contact',
      subtitle: 'Let’s connect for frontend roles, freelance work, or collaborations.',
      highlights: [],
      contactLinks: [
        { label: 'Email', icon: 'email', href: 'mailto:your.email@example.com' },
        { label: 'GitHub', icon: 'github', href: 'https://github.com/your-username' },
        { label: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com/in/your-username' }
      ],
      accentColor: '#b35ccf'
    }
  ];
  private activeSectionId?: string;
  private readonly infoPanelAnchor = new Vector3();
  private infoPanelTargetOpacity = 0;
  private readonly infoPanelFadeSpeed = 3.2;
  public infoPanelOpacity = 0;
  public infoPanelScreenX = 0;
  public infoPanelScreenY = 0;
  public activePanelSection?: PortfolioSection;
  private isMoving = false;
  private isRunning = false;
  private animationElapsed = 0;
  private footstepTimer = 0;
  private nextFootIsLeft = true;
  private hologramElapsed = 0;
  private readonly lastMoveDirection = new Vector3(0, 0, 1);
  private readonly footsteps: Array<{ mesh: Mesh; age: number; maxAge: number }> = [];
  private readonly uiSyncIntervalMs = 50;
  private lastUiSyncTimeMs = 0;
  private isExperienceStarted = false;
  private visualViewportListenersAttached = false;
  private readonly initialViewportSyncTimeoutIds: number[] = [];
  private currentCameraZoom = this.followCameraZoom;
  public showIntroButton = true;
  public showIntroOverlay = true;
  public isIntroOverlayClearing = false;
  public showTouchJoystick = false;
  public joystickViewportBottomOffset = 0;
  public joystickKnobOffsetX = 0;
  public joystickKnobOffsetY = 0;
  public introTitle = "Hi! I'm João.";
  public introSubtitle = 'Welcome to my world. Explore to know more.';

  public get shouldShowTouchJoystick(): boolean {
    return this.showTouchJoystick && this.isExperienceStarted;
  }

  constructor(
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.initializeScene();
    this.addWorld();
    this.addPlayer();
    this.addSectionStones();
    this.addPortalPaths();
    this.addFountain();
    this.addEnvironmentProps();
    this.addTrees();
    this.addAtmosphericLife();
    this.registerInputEvents();
    this.updateViewportCssVariable();
    this.handleResize();
    this.scheduleInitialViewportStabilization();
    this.ngZone.runOutsideAngular(() => this.animate());
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.resizeRetryFrameId) {
      cancelAnimationFrame(this.resizeRetryFrameId);
    }

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.detachVisualViewportListeners();
    this.initialViewportSyncTimeoutIds.forEach((id) => window.clearTimeout(id));
    this.initialViewportSyncTimeoutIds.length = 0;
    this.resetTouchJoystick();

    this.scene.traverse((object) => {
      if (object instanceof Mesh) {
        object.geometry.dispose();

        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    this.floorTexture?.dispose();
    this.wallTexture?.dispose();
    this.dirtPathTexture?.dispose();
    this.roadPathTexture?.dispose();
    this.stoneSurfaceTexture?.dispose();
    this.sectionHolograms.forEach((hologram) => {
      hologram.symbolTextures.forEach((texture) => texture.dispose());
    });

    const canvas = this.renderer.domElement;
    if (canvas.parentElement) {
      canvas.parentElement.removeChild(canvas);
    }

    this.renderer.dispose();
  }

  public startExperience(): void {
    if (this.isExperienceStarted) {
      return;
    }

    this.showIntroButton = false;
    this.isIntroOverlayClearing = true;
    this.isExperienceStarted = true;
  }

  public onIntroOverlayTransitionEnd(): void {
    if (!this.isIntroOverlayClearing) {
      return;
    }

    this.showIntroOverlay = false;
  }

  private initializeScene(): void {
    this.scene = new Scene();
    this.scene.background = new Color(0xf4c7a1);
    this.scene.fog = new FogExp2(0xf7c896, 0.0048);

    const existingCanvases = this.sceneContainer.nativeElement.querySelectorAll('canvas');
    existingCanvases.forEach((canvas) => canvas.remove());

    this.camera = new OrthographicCamera();
    this.camera.position.copy(this.cameraOffset);
    this.camera.zoom = this.followCameraZoom;
    this.currentCameraZoom = this.followCameraZoom;
    this.camera.lookAt(0, 0, 0);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.sceneContainer.nativeElement.appendChild(this.renderer.domElement);
  }

  private addWorld(): void {
    this.floorTexture = this.createGroundTexture();

    const groundGeometry = new PlaneGeometry(this.worldSize, this.worldSize, 72, 72);
    const vertices = groundGeometry.attributes.position;

    for (let i = 0; i < vertices.count; i += 1) {
      const x = vertices.getX(i);
      const z = vertices.getY(i);

      const radial = Math.hypot(x, z) / (this.worldSize * 0.5);
      const waveA = Math.sin(x * 0.22) * Math.cos(z * 0.18) * 0.055;
      const waveB = Math.sin((x + z) * 0.3) * 0.03;
      const edgeDrop = Math.max(0, radial - 0.78) * 0.16;
      vertices.setZ(i, waveA + waveB - edgeDrop);
    }

    groundGeometry.computeVertexNormals();

    const ground = new Mesh(
      groundGeometry,
      new MeshStandardMaterial({
        color: 0xa3b487,
        map: this.floorTexture,
        roughness: 0.95,
        metalness: 0
      })
    );

    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const worldUnderlay = new Mesh(
      new PlaneGeometry(this.worldUnderlaySize, this.worldUnderlaySize),
      new MeshStandardMaterial({
        color: 0x9cab86,
        roughness: 0.97,
        metalness: 0
      })
    );
    worldUnderlay.rotation.x = -Math.PI / 2;
    worldUnderlay.position.y = -2.6;
    worldUnderlay.receiveShadow = true;
    this.scene.add(worldUnderlay);

    this.addBoundaryWalls();

    const ambientLight = new AmbientLight(0xffd7ad, 1.02);
    this.scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffb474, 1.52);
    directionalLight.position.set(-38, 22, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);
    directionalLight.shadow.bias = -0.0001;
    directionalLight.shadow.normalBias = 0.028;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 120;
    directionalLight.shadow.camera.left = -45;
    directionalLight.shadow.camera.right = 45;
    directionalLight.shadow.camera.top = 45;
    directionalLight.shadow.camera.bottom = -45;
    this.scene.add(directionalLight);

    const fillLight = new DirectionalLight(0xffd2aa, 0.38);
    fillLight.position.set(22, 14, -26);
    this.scene.add(fillLight);

    const bounceLight = new AmbientLight(0xffb785, 0.16);
    this.scene.add(bounceLight);
  }

  private addBoundaryWalls(): void {
    const edge = this.worldSize / 2;
    const wallHeight = 2.5;
    const wallThickness = 1.05;

    this.wallTexture = this.createBrickWallTexture();

    const wallMaterial = new MeshStandardMaterial({
      color: 0xc79d78,
      map: this.wallTexture,
      roughness: 0.88,
      metalness: 0.02
    });

    const capMaterial = new MeshStandardMaterial({ color: 0xa7805d, roughness: 0.9, metalness: 0 });

    const northWall = new Mesh(new BoxGeometry(this.worldSize + wallThickness, wallHeight, wallThickness), wallMaterial);
    northWall.position.set(0, wallHeight / 2, -edge + wallThickness / 2);

    const southWall = new Mesh(new BoxGeometry(this.worldSize + wallThickness, wallHeight, wallThickness), wallMaterial);
    southWall.position.set(0, wallHeight / 2, edge - wallThickness / 2);

    const westWall = new Mesh(new BoxGeometry(wallThickness, wallHeight, this.worldSize + wallThickness), wallMaterial);
    westWall.position.set(-edge + wallThickness / 2, wallHeight / 2, 0);

    const eastWall = new Mesh(new BoxGeometry(wallThickness, wallHeight, this.worldSize + wallThickness), wallMaterial);
    eastWall.position.set(edge - wallThickness / 2, wallHeight / 2, 0);

    const northCap = new Mesh(new BoxGeometry(this.worldSize + wallThickness, 0.22, wallThickness * 0.84), capMaterial);
    northCap.position.set(0, wallHeight + 0.1, -edge + wallThickness / 2);

    const southCap = new Mesh(new BoxGeometry(this.worldSize + wallThickness, 0.22, wallThickness * 0.84), capMaterial);
    southCap.position.set(0, wallHeight + 0.1, edge - wallThickness / 2);

    const westCap = new Mesh(new BoxGeometry(wallThickness * 0.84, 0.22, this.worldSize + wallThickness), capMaterial);
    westCap.position.set(-edge + wallThickness / 2, wallHeight + 0.1, 0);

    const eastCap = new Mesh(new BoxGeometry(wallThickness * 0.84, 0.22, this.worldSize + wallThickness), capMaterial);
    eastCap.position.set(edge - wallThickness / 2, wallHeight + 0.1, 0);

    [northWall, southWall, westWall, eastWall, northCap, southCap, westCap, eastCap].forEach((wall) => {
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.scene.add(wall);
    });
  }

  private addPortalPaths(): void {
    if (this.sectionStones.length === 0) {
      return;
    }

    this.dirtPathTexture = this.createDirtPathTexture();
    const maxStoneDistance = Math.max(...this.sectionStones.map((stone) => Math.hypot(stone.position.x, stone.position.z)));
    this.patioRadius = maxStoneDistance + 0.9;

    const { patioBase, patioCore, patioEdge } = this.createPatioSurfaceMaterials();

    const baseDisc = new Mesh(new CircleGeometry(this.patioRadius + 1.2, 70), patioBase);
    baseDisc.rotation.x = -Math.PI / 2;
    baseDisc.position.y = 0.04;
    baseDisc.receiveShadow = true;
    this.scene.add(baseDisc);

    const coreDisc = new Mesh(new CircleGeometry(this.patioRadius, 90), patioCore);
    coreDisc.rotation.x = -Math.PI / 2;
    coreDisc.position.y = 0.058;
    coreDisc.receiveShadow = true;
    this.scene.add(coreDisc);

    const edgeDisc = new Mesh(new CircleGeometry(this.patioRadius + 0.45, 80), patioEdge);
    edgeDisc.rotation.x = -Math.PI / 2;
    edgeDisc.position.y = 0.05;
    edgeDisc.receiveShadow = true;
    this.scene.add(edgeDisc);

    this.addOuterConnectorRoads();

    for (let i = 0; i < 180; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (this.patioRadius + 0.8);
      const point = new Vector3(Math.cos(angle) * radius, 0.055, Math.sin(angle) * radius);

      if (radius > this.patioRadius - 1.5 || i % 3 === 0) {
        this.addPathPebble(point, 0.45);
      }
    }

    this.sectionStones.forEach((stone) => {
      const blend = new Mesh(
        new CircleGeometry(2.2, 24),
        new MeshStandardMaterial({ color: 0x8f836d, map: this.dirtPathTexture, roughness: 0.9, metalness: 0.03 })
      );
      blend.rotation.x = -Math.PI / 2;
      blend.position.set(stone.position.x, 0.057, stone.position.z);
      this.scene.add(blend);
    });
  }

  private createPatioSurfaceMaterials(polygonOffset = -3, textureScale = 1): {
    patioBase: MeshStandardMaterial;
    patioCore: MeshStandardMaterial;
    patioEdge: MeshStandardMaterial;
  } {
    const patioTexture = this.dirtPathTexture && textureScale !== 1
      ? (() => {
        const texture = this.dirtPathTexture!.clone();
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.repeat.set(4.2 * textureScale, 4.2 * textureScale);
        texture.needsUpdate = true;
        return texture;
      })()
      : this.dirtPathTexture;

    return {
      patioBase: new MeshStandardMaterial({
        color: 0x918671,
        map: patioTexture,
        roughness: 0.9,
        metalness: 0.03,
        polygonOffset: true,
        polygonOffsetFactor: polygonOffset,
        polygonOffsetUnits: polygonOffset
      }),
      patioCore: new MeshStandardMaterial({
        color: 0x9b907a,
        map: patioTexture,
        roughness: 0.88,
        metalness: 0.04,
        polygonOffset: true,
        polygonOffsetFactor: polygonOffset,
        polygonOffsetUnits: polygonOffset
      }),
      patioEdge: new MeshStandardMaterial({
        color: 0x7b715d,
        map: patioTexture,
        roughness: 0.92,
        metalness: 0.02,
        polygonOffset: true,
        polygonOffsetFactor: polygonOffset,
        polygonOffsetUnits: polygonOffset
      })
    };
  }

  private addOuterConnectorRoads(): void {
    this.roadPathTexture?.dispose();
    this.roadPathTexture = undefined;

    const { patioBase, patioCore, patioEdge } = this.createPatioSurfaceMaterials();
    const roadBaseMaterial = patioBase;
    const roadCoreMaterial = patioCore;
    const roadEdgeMaterial = patioEdge;
    const mapHalf = this.worldSize / 2;
    const outerStart = Math.max(0, this.patioRadius - 5.2);
    const outerLength = mapHalf - outerStart - 2.1;

    const connectors = [
      { x: mapHalf - 1.05 - outerLength / 2, z: 0, rot: 0, horizontal: true },
      { x: -mapHalf + 1.05 + outerLength / 2, z: 0, rot: 0, horizontal: true },
      { x: 0, z: mapHalf - 1.05 - outerLength / 2, rot: Math.PI / 2, horizontal: false },
      { x: 0, z: -mapHalf + 1.05 + outerLength / 2, rot: Math.PI / 2, horizontal: false }
    ];

    connectors.forEach((connector) => {
      const edgeLength = connector.horizontal ? outerLength + 0.72 : 3.86;
      const edgeWidth = connector.horizontal ? 3.86 : outerLength + 0.72;
      const edgeSlab = new Mesh(new PlaneGeometry(edgeLength, edgeWidth), roadEdgeMaterial);
      edgeSlab.rotation.set(-Math.PI / 2, 0, 0);
      edgeSlab.position.set(connector.x, 0.052, connector.z);
      edgeSlab.receiveShadow = true;
      this.scene.add(edgeSlab);

      const baseLength = connector.horizontal ? outerLength + 0.36 : 3.22;
      const baseWidth = connector.horizontal ? 3.22 : outerLength + 0.36;
      const baseSlab = new Mesh(new PlaneGeometry(baseLength, baseWidth), roadBaseMaterial);
      baseSlab.rotation.set(-Math.PI / 2, 0, 0);
      baseSlab.position.set(connector.x, 0.056, connector.z);
      baseSlab.receiveShadow = true;
      this.scene.add(baseSlab);

      const coreLength = connector.horizontal ? outerLength : 2.66;
      const coreWidth = connector.horizontal ? 2.66 : outerLength;
      const coreSlab = new Mesh(new PlaneGeometry(coreLength, coreWidth), roadCoreMaterial);
      coreSlab.rotation.set(-Math.PI / 2, 0, 0);
      coreSlab.position.set(connector.x, 0.06, connector.z);
      coreSlab.receiveShadow = true;
      this.scene.add(coreSlab);

      const direction = connector.horizontal ? Math.sign(connector.x) : Math.sign(connector.z);
      const dirX = connector.horizontal ? direction : 0;
      const dirZ = connector.horizontal ? 0 : direction;
      const innerEndX = connector.horizontal
        ? connector.x - Math.sign(connector.x) * (outerLength / 2)
        : connector.x;
      const innerEndZ = connector.horizontal
        ? connector.z
        : connector.z - Math.sign(connector.z) * (outerLength / 2);

      const edgeCap = new Mesh(new CircleGeometry(1.96, 30), roadEdgeMaterial);
      edgeCap.rotation.x = -Math.PI / 2;
      edgeCap.position.set(innerEndX, 0.052, innerEndZ);
      edgeCap.receiveShadow = true;
      this.scene.add(edgeCap);

      const baseCap = new Mesh(new CircleGeometry(1.66, 30), roadBaseMaterial);
      baseCap.rotation.x = -Math.PI / 2;
      baseCap.position.set(innerEndX, 0.056, innerEndZ);
      baseCap.receiveShadow = true;
      this.scene.add(baseCap);

      const coreCap = new Mesh(new CircleGeometry(1.38, 30), roadCoreMaterial);
      coreCap.rotation.x = -Math.PI / 2;
      coreCap.position.set(innerEndX, 0.06, innerEndZ);
      coreCap.receiveShadow = true;
      this.scene.add(coreCap);

      for (let i = 1; i <= 6; i += 1) {
        const t = i / 6;
        const stampX = innerEndX - dirX * t * 1.65;
        const stampZ = innerEndZ - dirZ * t * 1.65;
        const edgeRadius = 1.78 - t * 0.6;
        const baseRadius = 1.5 - t * 0.56;
        const coreRadius = 1.24 - t * 0.5;

        const edgeStamp = new Mesh(new CircleGeometry(edgeRadius, 28), roadEdgeMaterial);
        edgeStamp.rotation.x = -Math.PI / 2;
        edgeStamp.position.set(stampX, 0.052, stampZ);
        edgeStamp.receiveShadow = true;
        this.scene.add(edgeStamp);

        const baseStamp = new Mesh(new CircleGeometry(baseRadius, 28), roadBaseMaterial);
        baseStamp.rotation.x = -Math.PI / 2;
        baseStamp.position.set(stampX, 0.056, stampZ);
        baseStamp.receiveShadow = true;
        this.scene.add(baseStamp);

        const coreStamp = new Mesh(new CircleGeometry(coreRadius, 28), roadCoreMaterial);
        coreStamp.rotation.x = -Math.PI / 2;
        coreStamp.position.set(stampX, 0.06, stampZ);
        coreStamp.receiveShadow = true;
        this.scene.add(coreStamp);
      }
    });

  }

  private isOnOuterConnectorRoad(position: Vector3, padding = 0): boolean {
    const mapHalf = this.worldSize / 2;
    const outerStart = Math.max(0, this.patioRadius - 5.2);
    const outerEnd = mapHalf - 2.1;
    const halfWidth = 1.55 + padding;

    const horizontalRoad = Math.abs(position.z) <= halfWidth && Math.abs(position.x) >= outerStart && Math.abs(position.x) <= outerEnd;
    const verticalRoad = Math.abs(position.x) <= halfWidth && Math.abs(position.z) >= outerStart && Math.abs(position.z) <= outerEnd;

    return horizontalRoad || verticalRoad;
  }

  private isNearSectionStone(position: Vector3, minDistance: number): boolean {
    return this.sectionStones.some((stone) => stone.position.distanceTo(position) < minDistance);
  }

  private isOnPatioOrRoad(position: Vector3, padding = 0): boolean {
    const radialDistance = Math.hypot(position.x, position.z);
    if (radialDistance <= this.patioRadius + 1.55 + padding) {
      return true;
    }

    return this.isOnOuterConnectorRoad(position, padding);
  }

  private isOnForestGamingPatio(position: Vector3, padding = 0): boolean {
    const gamingDx = position.x - this.forestGamingPatioCenter.x;
    const gamingDz = position.z - this.forestGamingPatioCenter.z;
    const gamingRadius = 7.4 + padding;
    const isOnGamingPatioZone = gamingDx * gamingDx + gamingDz * gamingDz <= gamingRadius * gamingRadius;

    if (isOnGamingPatioZone) {
      return true;
    }

    const handballDx = position.x - this.forestPlaquePatioCenter.x;
    const handballDz = position.z - this.forestPlaquePatioCenter.z;
    const handballRadius = 8.2 + padding;
    if (handballDx * handballDx + handballDz * handballDz <= handballRadius * handballRadius) {
      return true;
    }

    const djDx = position.x - this.forestDjPatioCenter.x;
    const djDz = position.z - this.forestDjPatioCenter.z;
    const djRadius = 7.3 + padding;
    if (djDx * djDx + djDz * djDz <= djRadius * djRadius) {
      return true;
    }

    const socialDx = position.x - this.forestSocialPatioCenter.x;
    const socialDz = position.z - this.forestSocialPatioCenter.z;
    const socialRadius = 7.6 + padding;
    return socialDx * socialDx + socialDz * socialDz <= socialRadius * socialRadius;
  }

  private createSeededRandom(seed: number): () => number {
    let state = seed >>> 0;
    return (): number => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  private drawPathCurve(
    start: Vector3,
    control: Vector3,
    end: Vector3,
    samples: number,
    pathCore: MeshStandardMaterial,
    pathEdge: MeshBasicMaterial,
    pathBlend: MeshBasicMaterial,
    halfWidth: number
  ): void {
    for (let i = 1; i < samples; i += 1) {
      const t = i / samples;

      if (t < 0.07 || t > 0.95) {
        continue;
      }

      const point = this.getQuadraticPoint(start, control, end, t);
      const tangent = this.getQuadraticTangent(start, control, end, t);
      const angle = Math.atan2(tangent.z, tangent.x);
      const widthScale = 0.92 + Math.sin(t * Math.PI) * 0.24;

      const core = new Mesh(new CircleGeometry(halfWidth * widthScale, 20), pathCore);
      core.rotation.x = -Math.PI / 2;
      core.rotation.z = angle;
      core.position.set(point.x, 0.058, point.z);
      core.receiveShadow = true;
      this.scene.add(core);

      const shoulder = new Mesh(new CircleGeometry((halfWidth + 0.42) * widthScale, 16), pathEdge);
      shoulder.rotation.x = -Math.PI / 2;
      shoulder.rotation.z = angle;
      shoulder.position.set(point.x, 0.056, point.z);
      this.scene.add(shoulder);

      const blend = new Mesh(new CircleGeometry((halfWidth + 0.9) * widthScale, 14), pathBlend);
      blend.rotation.x = -Math.PI / 2;
      blend.rotation.z = angle;
      blend.position.set(point.x, 0.054, point.z);
      this.scene.add(blend);

      if (i % 3 === 0) {
        this.addPathPebble(point, halfWidth);
      }
    }
  }

  private addPathPebble(point: Vector3, spread: number): void {
    const pebbleColor = [0x8f7c67, 0x796651, 0xa08d76];

    for (let i = 0; i < 3; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * spread * 0.72;
      const pebble = new Mesh(
        new CircleGeometry(0.06 + Math.random() * 0.08, 8),
        new MeshBasicMaterial({ color: pebbleColor[Math.floor(Math.random() * pebbleColor.length)], transparent: true, opacity: 0.7 })
      );

      pebble.rotation.x = -Math.PI / 2;
      pebble.rotation.z = Math.random() * Math.PI * 2;
      pebble.position.set(point.x + Math.cos(angle) * distance, point.y + 0.006, point.z + Math.sin(angle) * distance);
      this.scene.add(pebble);
    }
  }

  private addEnvironmentProps(): void {
    this.addLampPosts();
    this.addBenches();
    this.addNatureProps();
    this.addSectionStoryProps();
    this.addForestGamingPatio();
    this.addSecondaryPlaquePatio();
    this.addForestDjPatio();
    this.addForestSocialPatio();
  }

  private addForestDjPatio(): void {
    const center = this.forestDjPatioCenter.clone();
    center.y = this.getSurfaceHeight(center.x, center.z);

    const { patioBase, patioCore, patioEdge } = this.createPatioSurfaceMaterials(-3, 3.2 / this.patioRadius);

    const baseDisc = new Mesh(new CircleGeometry(3.95, 42), patioBase);
    baseDisc.rotation.x = -Math.PI / 2;
    baseDisc.position.set(center.x, center.y + 0.042, center.z);
    baseDisc.receiveShadow = true;
    this.scene.add(baseDisc);

    const coreDisc = new Mesh(new CircleGeometry(3.2, 48), patioCore);
    coreDisc.rotation.x = -Math.PI / 2;
    coreDisc.position.set(center.x, center.y + 0.056, center.z);
    coreDisc.receiveShadow = true;
    this.scene.add(coreDisc);

    const edgeDisc = new Mesh(new CircleGeometry(3.58, 46), patioEdge);
    edgeDisc.rotation.x = -Math.PI / 2;
    edgeDisc.position.set(center.x, center.y + 0.05, center.z);
    edgeDisc.receiveShadow = true;
    this.scene.add(edgeDisc);

    for (let i = 0; i < 70; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.35 + Math.random() * 3.3;
      const point = new Vector3(
        center.x + Math.cos(angle) * radius,
        center.y + 0.058,
        center.z + Math.sin(angle) * radius
      );

      if (radius > 2.65 || i % 3 === 0) {
        this.addPathPebble(point, 0.34);
      }
    }

    const deckFrameMaterial = new MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.68, metalness: 0.24 });
    const deckTopMaterial = new MeshStandardMaterial({ color: 0x171b21, roughness: 0.62, metalness: 0.26 });
    const speakerMaterial = new MeshStandardMaterial({ color: 0x1e242b, roughness: 0.72, metalness: 0.2 });
    const coneMaterial = new MeshBasicMaterial({ color: 0x89f2ff, transparent: true, opacity: 0.86 });
    const deckLightMaterial = new MeshBasicMaterial({ color: 0x5de7ff });

    const boothZ = center.z;

    const boothTop = new Mesh(new BoxGeometry(3.1, 0.22, 1.08), deckFrameMaterial);
    boothTop.position.set(center.x, center.y + 1.32, boothZ);
    boothTop.castShadow = true;
    boothTop.receiveShadow = true;
    this.scene.add(boothTop);

    const controllerSurface = new Mesh(new BoxGeometry(2.7, 0.08, 0.82), deckTopMaterial);
    controllerSurface.position.set(center.x, center.y + 1.46, boothZ);
    controllerSurface.castShadow = true;
    controllerSurface.receiveShadow = true;
    this.scene.add(controllerSurface);

    const boothFront = new Mesh(new BoxGeometry(2.96, 0.74, 0.1), new MeshStandardMaterial({ color: 0x1f252d, roughness: 0.66, metalness: 0.22 }));
    boothFront.position.set(center.x, center.y + 0.96, boothZ + 0.44);
    boothFront.castShadow = true;
    boothFront.receiveShadow = true;
    this.scene.add(boothFront);

    const sidePanelLeft = new Mesh(new BoxGeometry(0.1, 0.72, 0.9), new MeshStandardMaterial({ color: 0x222a33, roughness: 0.7, metalness: 0.2 }));
    sidePanelLeft.position.set(center.x - 1.43, center.y + 0.95, boothZ);
    sidePanelLeft.castShadow = true;
    sidePanelLeft.receiveShadow = true;
    this.scene.add(sidePanelLeft);

    const sidePanelRight = new Mesh(new BoxGeometry(0.1, 0.72, 0.9), new MeshStandardMaterial({ color: 0x222a33, roughness: 0.7, metalness: 0.2 }));
    sidePanelRight.position.set(center.x + 1.43, center.y + 0.95, boothZ);
    sidePanelRight.castShadow = true;
    sidePanelRight.receiveShadow = true;
    this.scene.add(sidePanelRight);

    const underSpeakerOffsets = [-1.03, 1.03];
    underSpeakerOffsets.forEach((xOffset) => {
      const cabinet = new Mesh(new BoxGeometry(0.76, 0.96, 0.58), speakerMaterial);
      cabinet.position.set(center.x + xOffset, center.y + 0.52, boothZ - 0.04);
      cabinet.castShadow = true;
      cabinet.receiveShadow = true;
      this.scene.add(cabinet);

      const woofer = new Mesh(new CircleGeometry(0.18, 24), coneMaterial.clone());
      woofer.rotation.x = -Math.PI / 2;
      woofer.position.set(center.x + xOffset, center.y + 0.44, boothZ + 0.22);
      this.scene.add(woofer);

      const tweeter = new Mesh(new CircleGeometry(0.1, 20), coneMaterial.clone());
      tweeter.rotation.x = -Math.PI / 2;
      tweeter.position.set(center.x + xOffset, center.y + 0.72, boothZ + 0.22);
      this.scene.add(tweeter);
    });

    const centerRack = new Mesh(new BoxGeometry(0.9, 0.86, 0.54), new MeshStandardMaterial({ color: 0x252d36, roughness: 0.68, metalness: 0.22 }));
    centerRack.position.set(center.x, center.y + 0.5, boothZ - 0.04);
    centerRack.castShadow = true;
    centerRack.receiveShadow = true;
    this.scene.add(centerRack);

    const leftDeck = new Mesh(new CylinderGeometry(0.28, 0.28, 0.055, 30), new MeshStandardMaterial({ color: 0x383f48, roughness: 0.64, metalness: 0.22 }));
    leftDeck.rotation.x = Math.PI / 2;
    leftDeck.position.set(center.x - 0.83, center.y + 1.51, boothZ);
    leftDeck.castShadow = true;
    leftDeck.receiveShadow = true;
    this.scene.add(leftDeck);

    const rightDeck = new Mesh(new CylinderGeometry(0.28, 0.28, 0.055, 30), new MeshStandardMaterial({ color: 0x383f48, roughness: 0.64, metalness: 0.22 }));
    rightDeck.rotation.x = Math.PI / 2;
    rightDeck.position.set(center.x + 0.83, center.y + 1.51, boothZ);
    rightDeck.castShadow = true;
    rightDeck.receiveShadow = true;
    this.scene.add(rightDeck);

    const leftVinyl = new Mesh(new CylinderGeometry(0.22, 0.22, 0.016, 34), new MeshStandardMaterial({ color: 0x101318, roughness: 0.58, metalness: 0.16 }));
    leftVinyl.rotation.x = Math.PI / 2;
    leftVinyl.position.set(center.x - 0.83, center.y + 1.555, boothZ);
    leftVinyl.castShadow = true;
    leftVinyl.receiveShadow = true;
    this.scene.add(leftVinyl);

    const rightVinyl = new Mesh(new CylinderGeometry(0.22, 0.22, 0.016, 34), new MeshStandardMaterial({ color: 0x101318, roughness: 0.58, metalness: 0.16 }));
    rightVinyl.rotation.x = Math.PI / 2;
    rightVinyl.position.set(center.x + 0.83, center.y + 1.555, boothZ);
    rightVinyl.castShadow = true;
    rightVinyl.receiveShadow = true;
    this.scene.add(rightVinyl);

    const leftPlatterRing = new Mesh(new RingGeometry(0.13, 0.2, 30), new MeshBasicMaterial({ color: 0x2ed5ff, transparent: true, opacity: 0.44 }));
    leftPlatterRing.rotation.x = -Math.PI / 2;
    leftPlatterRing.position.set(center.x - 0.83, center.y + 1.563, boothZ);
    this.scene.add(leftPlatterRing);

    const rightPlatterRing = new Mesh(new RingGeometry(0.13, 0.2, 30), new MeshBasicMaterial({ color: 0xff7f66, transparent: true, opacity: 0.44 }));
    rightPlatterRing.rotation.x = -Math.PI / 2;
    rightPlatterRing.position.set(center.x + 0.83, center.y + 1.563, boothZ);
    this.scene.add(rightPlatterRing);

    const mixer = new Mesh(new BoxGeometry(0.66, 0.12, 0.34), new MeshStandardMaterial({ color: 0x3a434d, roughness: 0.62, metalness: 0.24 }));
    mixer.position.set(center.x, center.y + 1.54, boothZ);
    mixer.castShadow = true;
    mixer.receiveShadow = true;
    this.scene.add(mixer);

    const mixerGlow = new Mesh(new PlaneGeometry(0.42, 0.12), deckLightMaterial);
    mixerGlow.rotation.x = -Math.PI / 2;
    mixerGlow.position.set(center.x, center.y + 1.592, boothZ);
    this.scene.add(mixerGlow);

    const buttonColors = [0xff5c7a, 0x3ee5ff, 0xffd447, 0x8cf15c, 0xff8f40, 0xb28cff, 0x5ff0d2, 0xff6ec2];
    const buttonOffsets = [-0.2, -0.14, -0.08, -0.02, 0.02, 0.08, 0.14, 0.2];
    buttonOffsets.forEach((xOffset, index) => {
      const zOffset = index % 2 === 0 ? 0.06 : -0.03;
      const button = new Mesh(
        new CylinderGeometry(0.022, 0.022, 0.02, 14),
        new MeshBasicMaterial({ color: buttonColors[index] })
      );
      button.position.set(center.x + xOffset, center.y + 1.604, boothZ + zOffset);
      this.scene.add(button);
    });

    const crossfaderTrack = new Mesh(new BoxGeometry(0.28, 0.01, 0.03), new MeshStandardMaterial({ color: 0x20262d, roughness: 0.72, metalness: 0.12 }));
    crossfaderTrack.position.set(center.x, center.y + 1.598, boothZ - 0.1);
    this.scene.add(crossfaderTrack);

    const crossfaderKnob = new Mesh(new BoxGeometry(0.032, 0.024, 0.034), new MeshStandardMaterial({ color: 0x9aa4ae, roughness: 0.45, metalness: 0.36 }));
    crossfaderKnob.position.set(center.x + 0.066, center.y + 1.612, boothZ - 0.1);
    crossfaderKnob.castShadow = true;
    this.scene.add(crossfaderKnob);

    this.addPlaqueTrigger(new Vector3(center.x - 2.62, center.y, center.z - 2.2), {
      id: 'plaque-creativity-dj',
      title: 'DJ',
      subtitle: 'Being creative and having creative hobbies boosts craftmanship of code and solving problems in software.',
      highlights: [
        'Learning to mix music keeps me practicing rhythm, pattern recognition, and focused iteration, skills I also use when building interfaces and features.',
        'Creativity outside of code helps me return to programming with better ideas, more patience, and stronger problem-solving energy.'
      ],
      accentColor: '#67b36f'
    });

    const npcRig = this.createGamingNpcRig(deckLightMaterial);
    if (!npcRig) {
      return;
    }

    npcRig.group.position.set(center.x, center.y - 0.19, center.z + 0.82);
    npcRig.group.rotation.y = Math.PI;
    npcRig.leftLegPivot.rotation.x = -0.24;
    npcRig.rightLegPivot.rotation.x = 0.22;
    npcRig.leftArmPivot.rotation.x = -1.42;
    npcRig.rightArmPivot.rotation.x = -1.34;
    npcRig.leftArmPivot.rotation.z = 0.46;
    npcRig.rightArmPivot.rotation.z = -0.44;
    npcRig.torso.rotation.x = 0.16;
    npcRig.phase = Math.random() * Math.PI * 2;

    this.scene.add(npcRig.group);
    this.djNpc = npcRig;
  }

  private addForestSocialPatio(): void {
    const center = this.forestSocialPatioCenter.clone();
    center.y = this.getSurfaceHeight(center.x, center.z);

    const { patioBase, patioCore, patioEdge } = this.createPatioSurfaceMaterials(-3, 3.5 / this.patioRadius);

    const baseDisc = new Mesh(new CircleGeometry(4.35, 46), patioBase);
    baseDisc.rotation.x = -Math.PI / 2;
    baseDisc.position.set(center.x, center.y + 0.042, center.z);
    baseDisc.receiveShadow = true;
    this.scene.add(baseDisc);

    const coreDisc = new Mesh(new CircleGeometry(3.5, 54), patioCore);
    coreDisc.rotation.x = -Math.PI / 2;
    coreDisc.position.set(center.x, center.y + 0.056, center.z);
    coreDisc.receiveShadow = true;
    this.scene.add(coreDisc);

    const edgeDisc = new Mesh(new CircleGeometry(3.92, 50), patioEdge);
    edgeDisc.rotation.x = -Math.PI / 2;
    edgeDisc.position.set(center.x, center.y + 0.05, center.z);
    edgeDisc.receiveShadow = true;
    this.scene.add(edgeDisc);

    for (let i = 0; i < 86; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.35 + Math.random() * 3.9;
      const point = new Vector3(
        center.x + Math.cos(angle) * radius,
        center.y + 0.058,
        center.z + Math.sin(angle) * radius
      );

      if (radius > 3 || i % 3 === 0) {
        this.addPathPebble(point, 0.35);
      }
    }

    this.addPlaqueTrigger(new Vector3(center.x + 2.65, center.y, center.z - 2.35), {
      id: 'plaque-social-impact',
      title: 'People',
      subtitle: 'Connecting with other people is important, and understanding their challenges matters just as much as shipping features.',
      highlights: [
        'As a programmer, my responsibility is to build applications and products that make people\'s lives better in practical ways.',
        'Listening to users and teammates helps me identify real pain points, prioritize meaningful solutions, and avoid building things that look good but solve little.'
      ],
      accentColor: '#5b8fda'
    });

    const host = this.createNpcRig(false);
    if (!host) {
      return;
    }

    host.group.position.set(center.x, center.y - 0.18, center.z + 0.42);
    host.group.rotation.y = Math.PI;
    host.leftArmPivot.rotation.x = -0.74;
    host.rightArmPivot.rotation.x = -0.62;
    host.leftArmPivot.rotation.z = 0.22;
    host.rightArmPivot.rotation.z = -0.16;
    host.leftLegPivot.rotation.x = -0.12;
    host.rightLegPivot.rotation.x = 0.1;
    host.torso.rotation.x = 0.08;
    this.scene.add(host.group);
    this.socialCircleNpcs.push({
      npc: host,
      phase: Math.random() * Math.PI * 2,
      talkSpeed: 2.7,
      baseYaw: host.group.rotation.y,
      baseLeftArmX: -0.74,
      baseRightArmX: -0.62,
      emphasis: 1.2,
      baseY: host.group.position.y,
      speakingBias: 0.82
    });

    const palette = [
      [0x8e5c9f, 0x2c3340],
      [0x56a586, 0x2f3a45],
      [0xb26743, 0x303743],
      [0x4e7ea8, 0x2c3541],
      [0x9a5f6f, 0x2b3340],
      [0x738f44, 0x2f3844]
    ];

    const guestCount = 4 + Math.floor(Math.random() * 2);
    for (let i = 0; i < guestCount; i += 1) {
      const guest = this.createNpcRig(true);
      if (!guest) {
        continue;
      }

      const angle = (i / guestCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.28;
      const radius = 1.9 + Math.random() * 0.5;
      const posX = center.x + Math.cos(angle) * radius;
      const posZ = center.z + 0.18 + Math.sin(angle) * radius;
      guest.group.position.set(posX, this.getSurfaceHeight(posX, posZ) - 0.18 + this.playerGroundClearance, posZ);

      const baseYaw = Math.atan2(center.x - posX, center.z + 0.12 - posZ);
      guest.group.rotation.y = baseYaw;

      const choice = palette[Math.floor(Math.random() * palette.length)];
      this.applyNpcPalette(guest, choice[0], choice[1]);
      this.addNpcHair(guest, 0x2f2a24 + Math.floor(Math.random() * 0x303030));

      const baseLeftArm = -0.54 + Math.random() * 0.16;
      const baseRightArm = -0.5 + Math.random() * 0.16;
      guest.leftArmPivot.rotation.x = baseLeftArm;
      guest.rightArmPivot.rotation.x = baseRightArm;
      guest.leftArmPivot.rotation.z = 0.16;
      guest.rightArmPivot.rotation.z = -0.16;
      guest.leftLegPivot.rotation.x = -0.08;
      guest.rightLegPivot.rotation.x = 0.08;
      guest.torso.rotation.x = 0.03;

      const scale = 0.9 + Math.random() * 0.1;
      guest.group.scale.setScalar(scale);

      this.scene.add(guest.group);
      this.socialCircleNpcs.push({
        npc: guest,
        phase: Math.random() * Math.PI * 2,
        talkSpeed: 1.8 + Math.random() * 1.2,
        baseYaw,
        baseLeftArmX: baseLeftArm,
        baseRightArmX: baseRightArm,
        emphasis: 0.75 + Math.random() * 0.5,
        baseY: guest.group.position.y,
        speakingBias: 0.28 + Math.random() * 0.52
      });
    }
  }

  private addSecondaryPlaquePatio(): void {
    const center = this.forestPlaquePatioCenter.clone();
    center.y = this.getSurfaceHeight(center.x, center.z);

    const { patioBase, patioCore, patioEdge } = this.createPatioSurfaceMaterials(-3, 3.45 / this.patioRadius);

    const baseDisc = new Mesh(new CircleGeometry(4.25, 44), patioBase);
    baseDisc.rotation.x = -Math.PI / 2;
    baseDisc.position.set(center.x, center.y + 0.042, center.z);
    baseDisc.receiveShadow = true;
    this.scene.add(baseDisc);

    const coreDisc = new Mesh(new CircleGeometry(3.45, 52), patioCore);
    coreDisc.rotation.x = -Math.PI / 2;
    coreDisc.position.set(center.x, center.y + 0.056, center.z);
    coreDisc.receiveShadow = true;
    this.scene.add(coreDisc);

    const edgeDisc = new Mesh(new CircleGeometry(3.85, 48), patioEdge);
    edgeDisc.rotation.x = -Math.PI / 2;
    edgeDisc.position.set(center.x, center.y + 0.05, center.z);
    edgeDisc.receiveShadow = true;
    this.scene.add(edgeDisc);

    for (let i = 0; i < 78; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.4 + Math.random() * 3.8;
      const point = new Vector3(
        center.x + Math.cos(angle) * radius,
        center.y + 0.058,
        center.z + Math.sin(angle) * radius
      );

      if (radius > 2.9 || i % 3 === 0) {
        this.addPathPebble(point, 0.35);
      }
    }

    this.addPlaqueTrigger(new Vector3(center.x - 2.95, center.y, center.z + 2.55), {
      id: 'plaque-handball',
      title: 'Handball',
      subtitle: 'As an ex-handball player, I learned to work in team environments and step into leadership roles when needed.',
      highlights: [
        'Handball taught me communication, trust, and coordination under pressure, which transfers directly to collaborative work.',
        'Leading on the court helped me build ownership, resilience, and decision-making habits that are useful in organizations.'
      ],
      accentColor: '#e07a4f'
    });
    this.addHandballShowcase(center);
  }

  private addHandballShowcase(center: Vector3): void {
    const goalWidth = 3.2;
    const goalHeight = 2.05;
    const goalDepth = 1.05;
    const goalCenterX = center.x + 2.1;
    const goalLineZ = center.z - 0.95;

    const postMaterial = new MeshStandardMaterial({ color: 0xf1f1f1, roughness: 0.46, metalness: 0.18 });
    const netCanvas = document.createElement('canvas');
    netCanvas.width = 128;
    netCanvas.height = 128;
    const netCtx = netCanvas.getContext('2d');
    if (netCtx) {
      netCtx.clearRect(0, 0, netCanvas.width, netCanvas.height);
      netCtx.strokeStyle = 'rgba(212, 232, 247, 0.9)';
      netCtx.lineWidth = 2;
      for (let x = 0; x <= 128; x += 16) {
        netCtx.beginPath();
        netCtx.moveTo(x, 0);
        netCtx.lineTo(x, 128);
        netCtx.stroke();
      }
      for (let y = 0; y <= 128; y += 16) {
        netCtx.beginPath();
        netCtx.moveTo(0, y);
        netCtx.lineTo(128, y);
        netCtx.stroke();
      }
    }
    const netTexture = new CanvasTexture(netCanvas);
    netTexture.needsUpdate = true;
    const netMaterial = new MeshBasicMaterial({
      color: 0xe7f5ff,
      map: netTexture,
      transparent: true,
      opacity: 0.72,
      side: DoubleSide,
      depthWrite: false
    });
    const goalMarkMaterial = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });

    const leftPost = new Mesh(new CylinderGeometry(0.055, 0.055, goalHeight, 12), postMaterial);
    leftPost.position.set(goalCenterX - goalWidth / 2, center.y + goalHeight / 2, goalLineZ);
    leftPost.castShadow = true;
    leftPost.receiveShadow = true;
    this.scene.add(leftPost);

    const rightPost = new Mesh(new CylinderGeometry(0.055, 0.055, goalHeight, 12), postMaterial);
    rightPost.position.set(goalCenterX + goalWidth / 2, center.y + goalHeight / 2, goalLineZ);
    rightPost.castShadow = true;
    rightPost.receiveShadow = true;
    this.scene.add(rightPost);

    const crossbar = new Mesh(new CylinderGeometry(0.05, 0.05, goalWidth, 12), postMaterial);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(goalCenterX, center.y + goalHeight, goalLineZ);
    crossbar.castShadow = true;
    crossbar.receiveShadow = true;
    this.scene.add(crossbar);

    const backLeft = new Mesh(new CylinderGeometry(0.04, 0.04, goalDepth, 10), postMaterial);
    backLeft.rotation.x = Math.PI / 2;
    backLeft.position.set(goalCenterX - goalWidth / 2, center.y + 0.04, goalLineZ - goalDepth / 2);
    backLeft.castShadow = true;
    backLeft.receiveShadow = true;
    this.scene.add(backLeft);

    const backRight = new Mesh(new CylinderGeometry(0.04, 0.04, goalDepth, 10), postMaterial);
    backRight.rotation.x = Math.PI / 2;
    backRight.position.set(goalCenterX + goalWidth / 2, center.y + 0.04, goalLineZ - goalDepth / 2);
    backRight.castShadow = true;
    backRight.receiveShadow = true;
    this.scene.add(backRight);

    const roofBack = new Mesh(new CylinderGeometry(0.04, 0.04, goalWidth, 10), postMaterial);
    roofBack.rotation.z = Math.PI / 2;
    roofBack.position.set(goalCenterX, center.y + goalHeight, goalLineZ - goalDepth);
    roofBack.castShadow = true;
    roofBack.receiveShadow = true;
    this.scene.add(roofBack);

    const netBack = new Mesh(new PlaneGeometry(goalWidth - 0.08, goalHeight - 0.1), netMaterial);
    netBack.position.set(goalCenterX, center.y + goalHeight / 2, goalLineZ - goalDepth + 0.02);
    this.scene.add(netBack);

    const netLeft = new Mesh(new PlaneGeometry(goalDepth, goalHeight - 0.1), netMaterial.clone());
    netLeft.rotation.y = Math.PI / 2;
    netLeft.position.set(goalCenterX - goalWidth / 2 + 0.02, center.y + goalHeight / 2, goalLineZ - goalDepth / 2);
    this.scene.add(netLeft);

    const netRight = new Mesh(new PlaneGeometry(goalDepth, goalHeight - 0.1), netMaterial.clone());
    netRight.rotation.y = -Math.PI / 2;
    netRight.position.set(goalCenterX + goalWidth / 2 - 0.02, center.y + goalHeight / 2, goalLineZ - goalDepth / 2);
    this.scene.add(netRight);

    const netTop = new Mesh(new PlaneGeometry(goalWidth - 0.1, goalDepth), netMaterial.clone());
    netTop.rotation.x = Math.PI / 2;
    netTop.position.set(goalCenterX, center.y + goalHeight - 0.02, goalLineZ - goalDepth / 2);
    this.scene.add(netTop);

    const sixMeterArc = new Mesh(new RingGeometry(1.65, 1.74, 32, 1, Math.PI * 0.1, Math.PI * 0.8), goalMarkMaterial);
    sixMeterArc.rotation.x = -Math.PI / 2;
    sixMeterArc.position.set(goalCenterX, center.y + 0.063, goalLineZ - 0.08);
    this.scene.add(sixMeterArc);

    const shooter = this.createNpcRig(false);
    const goalkeeper = this.createNpcRig();
    if (!shooter || !goalkeeper) {
      return;
    }

    const shooterStart = new Vector3(center.x - 0.9, this.getSurfaceHeight(center.x - 0.9, center.z + 2.18) + this.playerGroundClearance, center.z + 2.18);
    shooter.group.position.copy(shooterStart);
    shooter.group.rotation.y = 2.28;
    shooter.torso.rotation.x = 0.06;
    shooter.leftLegPivot.rotation.x = -0.22;
    shooter.rightLegPivot.rotation.x = 0.34;
    this.scene.add(shooter.group);

    const goalkeeperBase = new Vector3(goalCenterX + 0.16, this.getSurfaceHeight(goalCenterX + 0.16, goalLineZ + 0.66) + this.playerGroundClearance, goalLineZ + 0.66);
    goalkeeper.group.position.copy(goalkeeperBase);
    goalkeeper.group.rotation.y = -0.2;
    goalkeeper.leftArmPivot.rotation.x = -1.18;
    goalkeeper.rightArmPivot.rotation.x = -1.18;
    goalkeeper.leftArmPivot.rotation.z = 0.98;
    goalkeeper.rightArmPivot.rotation.z = -0.98;
    goalkeeper.leftLegPivot.rotation.x = 0.12;
    goalkeeper.rightLegPivot.rotation.x = -0.12;
    this.applyHandballUniform(goalkeeper, 0xc7202f, 0xf0f0f0, false);
    this.scene.add(goalkeeper.group);

    const ball = new Mesh(
      new SphereGeometry(0.12, 18, 14),
      new MeshStandardMaterial({ color: 0xe96f1f, roughness: 0.68, metalness: 0.05 })
    );
    ball.castShadow = true;
    ball.receiveShadow = true;
    ball.position.set(center.x - 0.64, center.y + 1.22, center.z - 1.08);
    this.scene.add(ball);

    this.handballScene = {
      center: center.clone(),
      shooter,
      goalkeeper,
      ball,
      netMaterials: [
        netBack.material as MeshBasicMaterial,
        netLeft.material as MeshBasicMaterial,
        netRight.material as MeshBasicMaterial,
        netTop.material as MeshBasicMaterial
      ],
      shooterStart,
      goalkeeperBase,
      goalCenterX,
      goalLineZ,
      phase: 0,
      cycleDuration: 4.4,
      shotDirection: 0,
      shotHeight: 1,
      shotScored: true,
      shotArc: 0.7
    };

    this.resetHandballCycle(this.handballScene);
  }

  private addPlaqueTrigger(plaquePosition: Vector3, panelSection: PortfolioSection): void {
    const standHeight = 2.05;

    const plaqueStand = new Mesh(
      new CylinderGeometry(0.11, 0.14, standHeight, 10),
      new MeshStandardMaterial({ color: 0x756a58, roughness: 0.86, metalness: 0.06 })
    );
    plaqueStand.position.set(plaquePosition.x, plaquePosition.y + 1.24, plaquePosition.z);
    plaqueStand.castShadow = true;
    plaqueStand.receiveShadow = true;
    this.scene.add(plaqueStand);

    const plaquePlate = new Mesh(
      new BoxGeometry(0.92, 0.34, 0.09),
      new MeshStandardMaterial({ color: 0x9e8d73, roughness: 0.78, metalness: 0.12 })
    );
    plaquePlate.position.set(plaquePosition.x, plaquePosition.y + 2.3, plaquePosition.z + 0.09);
    plaquePlate.rotation.x = -0.24;
    plaquePlate.castShadow = true;
    plaquePlate.receiveShadow = true;
    this.scene.add(plaquePlate);

    const plaqueAccent = new Mesh(
      new PlaneGeometry(0.76, 0.14),
      new MeshBasicMaterial({ color: 0xcde7ff, transparent: true, opacity: 0.72 })
    );
    plaqueAccent.position.set(plaquePosition.x, plaquePosition.y + 2.35, plaquePosition.z + 0.14);
    plaqueAccent.rotation.x = -0.24;
    this.scene.add(plaqueAccent);

    const outlineMaterial = new MeshBasicMaterial({
      color: 0xa5e6ff,
      transparent: true,
      opacity: 0.28,
      side: BackSide,
      depthWrite: false
    });

    const standOutline = new Mesh(
      new CylinderGeometry(0.11, 0.14, standHeight, 10),
      outlineMaterial.clone()
    );
    standOutline.position.copy(plaqueStand.position);
    standOutline.scale.set(1.04, 1.04, 1.04);
    this.scene.add(standOutline);

    const plateOutline = new Mesh(
      new BoxGeometry(0.92, 0.34, 0.09),
      outlineMaterial.clone()
    );
    plateOutline.position.copy(plaquePlate.position);
    plateOutline.rotation.copy(plaquePlate.rotation);
    plateOutline.scale.set(1.05, 1.05, 1.08);
    this.scene.add(plateOutline);

    this.forestPlaqueTriggers.push({
      position: plaquePosition,
      sectionId: panelSection.id,
      panelSection,
      triggerRadius: 3.4,
      standOutline,
      plateOutline,
      phase: Math.random() * Math.PI * 2
    });
  }

  private addForestGamingPatio(): void {
    const center = this.forestGamingPatioCenter.clone();
    center.y = this.getSurfaceHeight(center.x, center.z);

    const { patioBase, patioCore, patioEdge } = this.createPatioSurfaceMaterials(-3, 3.45 / this.patioRadius);

    const baseDisc = new Mesh(new CircleGeometry(4.25, 44), patioBase);
    baseDisc.rotation.x = -Math.PI / 2;
    baseDisc.position.set(center.x, center.y + 0.042, center.z);
    baseDisc.receiveShadow = true;
    this.scene.add(baseDisc);

    const coreDisc = new Mesh(new CircleGeometry(3.45, 52), patioCore);
    coreDisc.rotation.x = -Math.PI / 2;
    coreDisc.position.set(center.x, center.y + 0.056, center.z);
    coreDisc.receiveShadow = true;
    this.scene.add(coreDisc);

    const edgeDisc = new Mesh(new CircleGeometry(3.85, 48), patioEdge);
    edgeDisc.rotation.x = -Math.PI / 2;
    edgeDisc.position.set(center.x, center.y + 0.05, center.z);
    edgeDisc.receiveShadow = true;
    this.scene.add(edgeDisc);

    for (let i = 0; i < 78; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.4 + Math.random() * 3.8;
      const point = new Vector3(
        center.x + Math.cos(angle) * radius,
        center.y + 0.058,
        center.z + Math.sin(angle) * radius
      );

      if (radius > 2.9 || i % 3 === 0) {
        this.addPathPebble(point, 0.35);
      }
    }

    const wood = new MeshStandardMaterial({ color: 0x8a6345, roughness: 0.83, metalness: 0.06 });
    const metal = new MeshStandardMaterial({ color: 0x596370, roughness: 0.74, metalness: 0.22 });
    const computerBody = new MeshStandardMaterial({ color: 0x2a2f39, roughness: 0.62, metalness: 0.28 });
    const screenMaterial = new MeshBasicMaterial({ color: 0x67d7ff });
    const workstationDeskZ = center.z - 0.62;
    const workstationChairZ = center.z + 0.62;

    const deskTop = new Mesh(new BoxGeometry(2.55, 0.1, 1.24), wood);
    deskTop.position.set(center.x, center.y + 0.82, workstationDeskZ);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    this.scene.add(deskTop);

    const legOffsets = [
      [-1.12, -0.5],
      [1.12, -0.5],
      [-1.12, 0.5],
      [1.12, 0.5]
    ];
    legOffsets.forEach(([x, z]) => {
      const leg = new Mesh(new BoxGeometry(0.1, 0.74, 0.1), metal);
      leg.position.set(center.x + x, center.y + 0.41, workstationDeskZ + z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      this.scene.add(leg);
    });

    const monitorStand = new Mesh(new BoxGeometry(0.1, 0.26, 0.1), computerBody);
    monitorStand.position.set(center.x, center.y + 0.98, workstationDeskZ - 0.29);
    monitorStand.castShadow = true;
    this.scene.add(monitorStand);

    const monitorFrame = new Mesh(new BoxGeometry(0.96, 0.6, 0.08), computerBody);
    monitorFrame.position.set(center.x, center.y + 1.34, workstationDeskZ - 0.33);
    monitorFrame.castShadow = true;
    this.scene.add(monitorFrame);

    const monitorScreen = new Mesh(new PlaneGeometry(0.8, 0.46), screenMaterial);
    monitorScreen.position.set(center.x, center.y + 1.34, workstationDeskZ - 0.28);
    this.scene.add(monitorScreen);

    const towerPc = new Mesh(new BoxGeometry(0.34, 0.74, 0.52), computerBody);
    towerPc.position.set(center.x + 0.98, center.y + 1.24, workstationDeskZ - 0.27);
    towerPc.castShadow = true;
    towerPc.receiveShadow = true;
    this.scene.add(towerPc);

    const towerFront = new Mesh(new PlaneGeometry(0.24, 0.54), new MeshBasicMaterial({ color: 0x5a7fa3 }));
    towerFront.position.set(center.x + 0.98, center.y + 1.24, workstationDeskZ - 0.005);
    this.scene.add(towerFront);

    const keyboard = new Mesh(new BoxGeometry(0.76, 0.035, 0.28), computerBody);
    keyboard.position.set(center.x - 0.1, center.y + 0.87, workstationDeskZ + 0.27);
    keyboard.castShadow = true;
    keyboard.receiveShadow = true;
    this.scene.add(keyboard);

    const mouse = new Mesh(new BoxGeometry(0.12, 0.03, 0.18), computerBody);
    mouse.position.set(center.x + 0.46, center.y + 0.87, workstationDeskZ + 0.3);
    mouse.castShadow = true;
    mouse.receiveShadow = true;
    this.scene.add(mouse);

    const chairSeat = new Mesh(new CylinderGeometry(0.42, 0.46, 0.14, 20), new MeshStandardMaterial({ color: 0x2d3642, roughness: 0.66, metalness: 0.26 }));
    chairSeat.position.set(center.x, center.y + 0.56, workstationChairZ);
    chairSeat.castShadow = true;
    chairSeat.receiveShadow = true;
    this.scene.add(chairSeat);

    const chairBack = new Mesh(new BoxGeometry(0.58, 0.74, 0.14), new MeshStandardMaterial({ color: 0x303a47, roughness: 0.68, metalness: 0.24 }));
    chairBack.position.set(center.x, center.y + 1.02, workstationChairZ + 0.31);
    chairBack.castShadow = true;
    chairBack.receiveShadow = true;
    this.scene.add(chairBack);

    const chairPost = new Mesh(new CylinderGeometry(0.07, 0.08, 0.52, 12), metal);
    chairPost.position.set(center.x, center.y + 0.29, workstationChairZ);
    chairPost.castShadow = true;
    chairPost.receiveShadow = true;
    this.scene.add(chairPost);

    const chairBase = new Mesh(new CylinderGeometry(0.34, 0.42, 0.07, 16), metal);
    chairBase.position.set(center.x, center.y + 0.06, workstationChairZ);
    chairBase.castShadow = true;
    chairBase.receiveShadow = true;
    this.scene.add(chairBase);

    this.addPlaqueTrigger(new Vector3(center.x + 2.95, center.y, center.z + 2.55), {
      id: 'plaque-videogames',
      title: 'Videogames',
      subtitle: 'Videogames were my first connection to computers and influenced my decision to follow a computer science path.',
      highlights: [
        'Playing games made me curious about how digital systems are built, which motivated me to learn programming.',
        'That same curiosity evolved into a passion for game development as a creative and technical field.'
      ],
      accentColor: '#2e9f8c'
    });

    const npcRig = this.createGamingNpcRig(screenMaterial);
    if (!npcRig) {
      return;
    }

    npcRig.group.position.set(center.x, center.y - 0.34, workstationChairZ);
    npcRig.group.rotation.y = Math.PI;
    npcRig.leftLegPivot.rotation.x = -1.5;
    npcRig.rightLegPivot.rotation.x = -1.5;
    npcRig.leftArmPivot.rotation.x = -1.16;
    npcRig.rightArmPivot.rotation.x = -1.16;
    npcRig.leftArmPivot.rotation.z = 0.2;
    npcRig.rightArmPivot.rotation.z = -0.2;
    npcRig.torso.rotation.x = 0.2;
    npcRig.phase = Math.random() * Math.PI * 2;

    this.scene.add(npcRig.group);
    this.gamingNpc = npcRig;
  }

  private createGamingNpcRig(screenMaterial: MeshBasicMaterial): GamingNpc | undefined {
    const baseRig = this.createNpcRig(false);
    if (!baseRig) {
      return undefined;
    }

    return {
      group: baseRig.group,
      leftArmPivot: baseRig.leftArmPivot,
      rightArmPivot: baseRig.rightArmPivot,
      leftLegPivot: baseRig.leftLegPivot,
      rightLegPivot: baseRig.rightLegPivot,
      torso: baseRig.torso,
      head: baseRig.head,
      screenMaterial,
      phase: 0
    };
  }

  private createNpcRig(removeHeadphones = true): HandballNpc | undefined {
    const clonedCharacter = this.characterGroup.clone(true);
    clonedCharacter.scale.setScalar(0.95);

    if (removeHeadphones) {
      [
        'headbandArc',
        'headbandInnerArc',
        'leftHeadphoneConnector',
        'rightHeadphoneConnector',
        'leftHeadphoneCup',
        'leftHeadphoneCupInner',
        'rightHeadphoneCup',
        'rightHeadphoneCupInner'
      ].forEach((name) => {
        const accessory = clonedCharacter.getObjectByName(name);
        if (accessory?.parent) {
          accessory.parent.remove(accessory);
        }
      });
    }

    const leftArmPivot = clonedCharacter.getObjectByName('leftArmPivot') as Group | undefined;
    const rightArmPivot = clonedCharacter.getObjectByName('rightArmPivot') as Group | undefined;
    const leftLegPivot = clonedCharacter.getObjectByName('leftLegPivot') as Group | undefined;
    const rightLegPivot = clonedCharacter.getObjectByName('rightLegPivot') as Group | undefined;
    const torso = clonedCharacter.getObjectByName('playerTorso');
    const head = clonedCharacter.getObjectByName('playerHead');

    if (!leftArmPivot || !rightArmPivot || !leftLegPivot || !rightLegPivot || !torso || !head) {
      return undefined;
    }

    const npc = new Group();
    npc.add(clonedCharacter);
    npc.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    return {
      group: npc,
      leftArmPivot,
      rightArmPivot,
      leftLegPivot,
      rightLegPivot,
      torso,
      head
    };
  }

  private applyHandballUniform(npc: HandballNpc, primaryColor: number, secondaryColor: number, recolorLimbs: boolean): void {
    npc.group.traverse((object) => {
      if (!(object instanceof Mesh) || Array.isArray(object.material) || !(object.material instanceof MeshStandardMaterial)) {
        return;
      }

      const currentColor = object.material.color.getHex();

      if (currentColor === 0x374d68) {
        object.material = new MeshStandardMaterial({ color: primaryColor, roughness: 0.72, metalness: 0.05 });
        return;
      }

      if (recolorLimbs && currentColor === 0x273143) {
        object.material = new MeshStandardMaterial({ color: secondaryColor, roughness: 0.8, metalness: 0.04 });
      }
    });
  }

  private applyNpcPalette(npc: HandballNpc, torsoColor: number, limbColor: number): void {
    npc.group.traverse((object) => {
      if (!(object instanceof Mesh) || Array.isArray(object.material) || !(object.material instanceof MeshStandardMaterial)) {
        return;
      }

      const currentColor = object.material.color.getHex();
      if (currentColor === 0x374d68) {
        object.material = new MeshStandardMaterial({ color: torsoColor, roughness: 0.72, metalness: 0.05 });
        return;
      }

      if (currentColor === 0x273143) {
        object.material = new MeshStandardMaterial({ color: limbColor, roughness: 0.8, metalness: 0.04 });
      }
    });
  }

  private addNpcHair(npc: HandballNpc, hairColor: number): void {
    const hairCap = new Mesh(
      new SphereGeometry(0.215, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62),
      new MeshStandardMaterial({ color: hairColor, roughness: 0.84, metalness: 0.02 })
    );
    hairCap.position.set(0, 0.03, 0);
    hairCap.castShadow = true;
    hairCap.receiveShadow = true;
    npc.head.add(hairCap);
  }

  private addFountain(): void {
    const patioCenter = this.getPatioCenter();
    const fountain = new Group();
    fountain.position.set(patioCenter.x, 0, patioCenter.z);

    const stoneMaterial = new MeshStandardMaterial({ color: 0x9a8b78, roughness: 0.88, metalness: 0.06 });
    const trimMaterial = new MeshStandardMaterial({ color: 0x847662, roughness: 0.9, metalness: 0.04 });
    const waterMaterial = new MeshStandardMaterial({
      color: 0x67b2d8,
      transparent: true,
      opacity: 0.86,
      roughness: 0.2,
      metalness: 0.08,
      emissive: new Color(0x1e6b86),
      emissiveIntensity: 0.2,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4
    });

    const basin = new Mesh(new CylinderGeometry(2.2, 2.45, 0.46, 32), stoneMaterial);
    basin.position.y = 0.23;
    basin.castShadow = true;
    basin.receiveShadow = true;

    const basinLip = new Mesh(new TorusGeometry(2.25, 0.08, 12, 40), trimMaterial);
    basinLip.rotation.x = Math.PI / 2;
    basinLip.position.y = 0.47;
    basinLip.castShadow = true;

    const columnBase = new Mesh(new CylinderGeometry(0.5, 0.62, 0.36, 20), trimMaterial);
    columnBase.position.y = 0.66;
    columnBase.castShadow = true;
    columnBase.receiveShadow = true;

    const column = new Mesh(new CylinderGeometry(0.22, 0.28, 1.06, 16), stoneMaterial);
    column.position.y = 1.34;
    column.castShadow = true;
    column.receiveShadow = true;

    const topBowl = new Mesh(new CylinderGeometry(0.56, 0.4, 0.24, 20), trimMaterial);
    topBowl.position.y = 1.98;
    topBowl.castShadow = true;

    const topCap = new Mesh(new SphereGeometry(0.16, 14, 14), trimMaterial);
    topCap.position.y = 2.22;
    topCap.castShadow = true;

    const waterSurface = new Mesh(new CircleGeometry(1.78, 32), waterMaterial);
    waterSurface.rotation.x = -Math.PI / 2;
    waterSurface.position.y = 0.52;
    waterSurface.receiveShadow = true;
    this.fountainWaterSurface = waterSurface;

    const rippleMaterial = new MeshBasicMaterial({ color: 0xa3e7ff, transparent: true, opacity: 0.34, blending: AdditiveBlending, depthWrite: false });

    for (let i = 0; i < 3; i += 1) {
      const ripple = new Mesh(new TorusGeometry(0.4 + i * 0.28, 0.02, 8, 26), rippleMaterial.clone());
      ripple.rotation.x = Math.PI / 2;
      ripple.position.y = 0.525;
      this.fountainRipples.push(ripple);
      fountain.add(ripple);
    }

    const jetMaterial = new MeshBasicMaterial({
      color: 0x92e9ff,
      transparent: true,
      opacity: 0.56,
      blending: AdditiveBlending,
      depthWrite: false
    });

    const centerJet = new Mesh(new CylinderGeometry(0.05, 0.08, 1.18, 10), jetMaterial.clone());
    centerJet.position.y = 2.32;
    fountain.add(centerJet);
    this.fountainJets.push({ mesh: centerJet, baseY: 2.32, baseHeight: 1.18, phase: Math.random() * Math.PI * 2 });

    for (let i = 0; i < 4; i += 1) {
      const angle = (i / 4) * Math.PI * 2;
      const jet = new Mesh(new CylinderGeometry(0.04, 0.06, 0.86, 10), jetMaterial.clone());
      jet.position.set(Math.cos(angle) * 0.5, 1.95, Math.sin(angle) * 0.5);
      fountain.add(jet);
      this.fountainJets.push({
        mesh: jet,
        baseY: 1.95,
        baseHeight: 0.86,
        phase: Math.random() * Math.PI * 2 + i
      });
    }

    fountain.add(basin, basinLip, columnBase, column, topBowl, topCap, waterSurface);
    this.scene.add(fountain);
  }

  private getPatioCenter(): Vector3 {
    if (this.sectionStones.length === 0) {
      return new Vector3(0, 0, 0);
    }

    const center = new Vector3();
    this.sectionStones.forEach((stone) => {
      center.add(stone.position);
    });

    center.multiplyScalar(1 / this.sectionStones.length);
    center.y = 0;
    return center;
  }

  private addLampPosts(): void {
    const postMaterial = new MeshStandardMaterial({ color: 0x4d545c, roughness: 0.72, metalness: 0.28 });
    const lightCapMaterial = new MeshStandardMaterial({ color: 0xffd6a1, roughness: 0.3, metalness: 0.08, emissive: new Color(0xffb56d), emissiveIntensity: 0.55 });
    const postRadius = this.patioRadius - 3.3;
    const candidateAngles = [34, 82, 130, 178, 226, 274, 322].map((deg) => (deg * Math.PI) / 180);
    const positions: Vector3[] = [];

    candidateAngles.forEach((angle) => {
      const candidate = new Vector3(Math.cos(angle) * postRadius, 0, Math.sin(angle) * postRadius);

      if (this.isOnOuterConnectorRoad(candidate, 1.9)) {
        return;
      }

      if (this.isNearSectionStone(candidate, 4.8)) {
        return;
      }

      positions.push(candidate);
    });

    positions.forEach((position) => {
      const post = new Group();
      post.position.copy(position);

      const base = new Mesh(new CylinderGeometry(0.18, 0.24, 0.2, 8), postMaterial);
      base.position.y = 0.1;

      const shaft = new Mesh(new CylinderGeometry(0.08, 0.1, 2.7, 8), postMaterial);
      shaft.position.y = 1.5;

      const cap = new Mesh(new SphereGeometry(0.2, 10, 10), lightCapMaterial);
      cap.position.y = 2.9;

      const lampLight = new PointLight(0xffcc8c, 0.45, 11, 2);
      lampLight.position.y = 2.75;

      post.add(base, shaft, cap, lampLight);
      post.traverse((object) => {
        if (object instanceof Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });

      this.scene.add(post);
    });
  }

  private addBenches(): void {
    if (this.sectionStones.length < 2) {
      return;
    }

    const benchPositions: Vector3[] = [];

    for (let i = 0; i < this.sectionStones.length; i += 1) {
      const current = this.sectionStones[i].position;
      const next = this.sectionStones[(i + 1) % this.sectionStones.length].position;
      const midpointDirection = current.clone().add(next).normalize();
      const benchRadius = this.patioRadius - 2.3;
      benchPositions.push(new Vector3(midpointDirection.x * benchRadius, 0, midpointDirection.z * benchRadius));
    }

    const wood = new MeshStandardMaterial({ color: 0x8b6444, roughness: 0.86, metalness: 0.04 });
    const metal = new MeshStandardMaterial({ color: 0x5a646f, roughness: 0.76, metalness: 0.24 });

    benchPositions.forEach((position) => {
      if (this.isOnOuterConnectorRoad(position, 2.2)) {
        return;
      }

      if (this.isNearSectionStone(position, 4.6)) {
        return;
      }

      const bench = new Group();
      bench.position.copy(position);
      bench.rotation.y = Math.atan2(-position.x, -position.z);

      const seat = new Mesh(new BoxGeometry(2.2, 0.1, 0.6), wood);
      seat.position.y = 0.54;
      const back = new Mesh(new BoxGeometry(2.2, 0.5, 0.1), wood);
      back.position.set(0, 0.84, -0.23);
      const leftLeg = new Mesh(new BoxGeometry(0.16, 0.54, 0.52), metal);
      leftLeg.position.set(-0.85, 0.27, 0);
      const rightLeg = new Mesh(new BoxGeometry(0.16, 0.54, 0.52), metal);
      rightLeg.position.set(0.85, 0.27, 0);

      bench.add(seat, back, leftLeg, rightLeg);
      bench.traverse((object) => {
        if (object instanceof Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });

      this.scene.add(bench);
    });
  }

  private addNatureProps(): void {
    const bushMaterial = new MeshStandardMaterial({ color: 0x5d8749, roughness: 0.9, metalness: 0 });
    const rockMaterial = new MeshStandardMaterial({ color: 0x8f836f, roughness: 0.96, metalness: 0 });
    const flowerColors = [0xf4d35e, 0xf78c6b, 0xf8f3d4, 0xcde29f];

    for (let i = 0; i < 56; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 6 + Math.random() * 28;
      const position = new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);

      if (this.isOnPatioOrRoad(position, 1.6)) {
        continue;
      }

      if (this.isPortalZone(position, 3.5)) {
        continue;
      }

      const roll = Math.random();

      if (roll < 0.38) {
        const bush = new Mesh(new SphereGeometry(0.45 + Math.random() * 0.35, 10, 10), bushMaterial);
        bush.scale.set(1.2, 0.85 + Math.random() * 0.2, 1);
        bush.position.set(position.x, 0.35, position.z);
        bush.castShadow = true;
        bush.receiveShadow = true;
        this.scene.add(bush);
      } else if (roll < 0.7) {
        const rock = new Mesh(new SphereGeometry(0.24 + Math.random() * 0.22, 8, 8), rockMaterial);
        rock.scale.set(1.2, 0.65, 0.92 + Math.random() * 0.25);
        rock.rotation.y = Math.random() * Math.PI * 2;
        rock.position.set(position.x, 0.12, position.z);
        rock.castShadow = true;
        rock.receiveShadow = true;
        this.scene.add(rock);
      } else {
        const stem = new Mesh(new CylinderGeometry(0.02, 0.02, 0.18, 6), new MeshStandardMaterial({ color: 0x4f7441, roughness: 0.85, metalness: 0 }));
        stem.position.set(position.x, 0.09, position.z);
        const flower = new Mesh(new CircleGeometry(0.08 + Math.random() * 0.04, 8), new MeshBasicMaterial({ color: flowerColors[Math.floor(Math.random() * flowerColors.length)] }));
        flower.rotation.x = -Math.PI / 2;
        flower.position.set(position.x, 0.18, position.z);
        this.scene.add(stem, flower);
      }
    }
  }

  private addSectionStoryProps(): void {
    this.sectionStones.forEach((stone) => {
      const base = stone.position.clone().multiplyScalar(1.16);
      base.y = 0;

      if (this.isOnOuterConnectorRoad(base, 1.2) || this.isNearSectionStone(base, 2.7)) {
        return;
      }

      if (stone.section.id === 'skills') {
        const board = new Mesh(new BoxGeometry(0.9, 0.7, 0.08), new MeshStandardMaterial({ color: 0x495d7d, roughness: 0.78, metalness: 0.16 }));
        board.position.set(base.x, 0.55, base.z);
        this.scene.add(board);
      } else if (stone.section.id === 'portfolio') {
        const stand = new Mesh(new CylinderGeometry(0.2, 0.3, 0.95, 8), new MeshStandardMaterial({ color: 0x8f765b, roughness: 0.85, metalness: 0.04 }));
        stand.position.set(base.x, 0.48, base.z);
        this.scene.add(stand);
      } else if (stone.section.id === 'cv') {
        const caseProp = new Mesh(new BoxGeometry(0.75, 0.22, 0.5), new MeshStandardMaterial({ color: 0x6b5a4b, roughness: 0.82, metalness: 0.18 }));
        caseProp.position.set(base.x, 0.12, base.z);
        this.scene.add(caseProp);
      } else if (stone.section.id === 'contact') {
      } else if (stone.section.id === 'about') {
        const cozyStump = new Mesh(new CylinderGeometry(0.34, 0.4, 0.45, 10), new MeshStandardMaterial({ color: 0x7a5a3f, roughness: 0.92, metalness: 0 }));
        cozyStump.position.set(base.x, 0.22, base.z);
        this.scene.add(cozyStump);
      }
    });
  }

  private addAtmosphericLife(): void {
    this.spawnFloatingParticles();
    this.spawnButterflies();
    this.spawnBirds();
    this.spawnGrassTufts();
  }

  private spawnFloatingParticles(): void {
    const material = new MeshBasicMaterial({ color: 0xfff2d8, transparent: true, opacity: 0.18 });

    for (let i = 0; i < 34; i += 1) {
      const particle = new Mesh(new CircleGeometry(0.03 + Math.random() * 0.03, 8), material.clone());
      particle.rotation.x = -Math.PI / 2;
      particle.position.set((Math.random() - 0.5) * 60, 1.1 + Math.random() * 4.2, (Math.random() - 0.5) * 60);
      this.scene.add(particle);
      this.floatingParticles.push({
        mesh: particle,
        phase: Math.random() * Math.PI * 2,
        drift: new Vector3((Math.random() - 0.5) * 0.24, 0, (Math.random() - 0.5) * 0.24),
        baseY: particle.position.y
      });
    }
  }

  private spawnButterflies(): void {
    const wingMaterial = new MeshBasicMaterial({ color: 0xffc76b, transparent: true, opacity: 0.88, side: DoubleSide });

    for (let i = 0; i < 10; i += 1) {
      const group = new Group();
      const leftWing = new Mesh(new CircleGeometry(0.13, 10), wingMaterial.clone());
      const rightWing = new Mesh(new CircleGeometry(0.13, 10), wingMaterial.clone());
      leftWing.position.x = -0.1;
      rightWing.position.x = 0.1;
      group.add(leftWing, rightWing);

      const center = new Vector3((Math.random() - 0.5) * 26, 1.6 + Math.random() * 1.6, (Math.random() - 0.5) * 26);
      group.position.copy(center);
      this.scene.add(group);

      this.butterflies.push({
        group,
        leftWing,
        rightWing,
        phase: Math.random() * Math.PI * 2,
        radius: 0.8 + Math.random() * 1.4,
        speed: 0.45 + Math.random() * 0.35,
        center
      });
    }
  }

  private spawnBirds(): void {
    for (let i = 0; i < 3; i += 1) {
      const group = new Group();
      const wingMat = new MeshBasicMaterial({ color: 0x40382f, transparent: true, opacity: 0.8 });
      const leftWing = new Mesh(new BoxGeometry(0.42, 0.02, 0.12), wingMat);
      const rightWing = new Mesh(new BoxGeometry(0.42, 0.02, 0.12), wingMat);
      leftWing.position.x = -0.22;
      rightWing.position.x = 0.22;
      group.add(leftWing, rightWing);

      group.position.set(-34 - Math.random() * 12, 8.5 + Math.random() * 2, -10 + Math.random() * 20);
      this.scene.add(group);
      this.birds.push({
        group,
        leftWing,
        rightWing,
        heading: new Vector3(1, 0, Math.random() * 0.2 - 0.1),
        speed: 3.1 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  private spawnGrassTufts(): void {
    const bladeMaterial = new MeshStandardMaterial({ color: 0x6d9356, roughness: 0.9, metalness: 0 });

    for (let i = 0; i < 75; i += 1) {
      const position = new Vector3((Math.random() - 0.5) * 70, 0, (Math.random() - 0.5) * 70);

      if (this.isOnPatioOrRoad(position, 1.8)) {
        continue;
      }

      if (this.isPortalZone(position, 3.2)) {
        continue;
      }

      const tuft = new Group();
      tuft.position.copy(position);

      for (let j = 0; j < 3; j += 1) {
        const blade = new Mesh(new BoxGeometry(0.06, 0.46 + Math.random() * 0.25, 0.02), bladeMaterial);
        blade.position.y = 0.22;
        blade.position.x = (Math.random() - 0.5) * 0.2;
        blade.rotation.z = (Math.random() - 0.5) * 0.28;
        blade.rotation.y = Math.random() * Math.PI;
        tuft.add(blade);
      }

      this.scene.add(tuft);
      this.grassTufts.push({ group: tuft, phase: Math.random() * Math.PI * 2 });
    }
  }

  private addTrees(): void {
    const clusterCenters: Vector3[] = [];
    const halfSize = this.worldSize / 2 - 5;
    const rand = this.createSeededRandom(0x6a09e667);

    while (clusterCenters.length < 22) {
      const center = new Vector3((rand() * 2 - 1) * halfSize, 0, (rand() * 2 - 1) * halfSize);

      if (Math.hypot(center.x, center.z) < this.patioRadius + 2.2) {
        continue;
      }

      if (this.isPortalZone(center, 8.2)) {
        continue;
      }

      if (this.isOnPatioOrRoad(center, 1.4)) {
        continue;
      }

      if (this.isOnForestGamingPatio(center, 1.4)) {
        continue;
      }

      if (clusterCenters.some((other) => other.distanceTo(center) < 9)) {
        continue;
      }

      clusterCenters.push(center);
    }

    let treeIndex = 0;
    clusterCenters.forEach((center) => {
      const treesInCluster = 5 + Math.floor(rand() * 5);

      for (let i = 0; i < treesInCluster; i += 1) {
        const angle = rand() * Math.PI * 2;
        const radius = 0.8 + rand() * 3.2;
        const candidate = new Vector3(center.x + Math.cos(angle) * radius, 0, center.z + Math.sin(angle) * radius);

        if (this.isPortalZone(candidate, 7.3)) {
          continue;
        }

        if (Math.hypot(candidate.x, candidate.z) < 9.4) {
          continue;
        }

        if (Math.hypot(candidate.x, candidate.z) < this.patioRadius + 1.9) {
          continue;
        }

        if (this.isOnPatioOrRoad(candidate, 1.1)) {
          continue;
        }

        if (this.isOnForestGamingPatio(candidate, 1.1)) {
          continue;
        }

        this.addTree(candidate, treeIndex, rand);
        treeIndex += 1;
      }
    });
  }

  private addTree(position: Vector3, index: number, rand: () => number): void {
    const tree = new Group();
    tree.position.copy(position);
    tree.rotation.y = rand() * Math.PI * 2;

    const trunk = new Mesh(
      new CylinderGeometry(0.2, 0.27, 1.95 + rand() * 0.5, 10),
      new MeshStandardMaterial({ color: 0x6f4d34, roughness: 0.9, metalness: 0 })
    );
    trunk.position.y = 1.0;

    const foliageMaterial = new MeshStandardMaterial({ color: 0x4f7e41, roughness: 0.86, metalness: 0 });

    if (index % 5 === 0) {
      const coneA = new Mesh(new ConeGeometry(0.92, 1.35, 10), foliageMaterial);
      coneA.position.y = 2.1;
      const coneB = new Mesh(new ConeGeometry(0.7, 1.1, 10), foliageMaterial);
      coneB.position.y = 2.9;
      tree.add(coneA, coneB);
    } else if (index % 5 === 1) {
      const canopyLow = new Mesh(new SphereGeometry(1.08, 12, 12), foliageMaterial);
      canopyLow.position.y = 2.08;
      canopyLow.scale.set(1.35, 0.62, 1.2);
      const canopyTop = new Mesh(new SphereGeometry(0.62, 10, 10), foliageMaterial);
      canopyTop.position.y = 2.72;
      canopyTop.scale.set(1.05, 0.72, 1.02);
      tree.add(canopyLow, canopyTop);
    } else if (index % 5 === 2) {
      const canopyLeft = new Mesh(new SphereGeometry(0.72, 10, 10), foliageMaterial);
      canopyLeft.position.set(-0.42, 2.5, 0);
      canopyLeft.scale.set(1.12, 0.88, 1.04);
      const canopyRight = new Mesh(new SphereGeometry(0.7, 10, 10), foliageMaterial);
      canopyRight.position.set(0.44, 2.46, 0.1);
      canopyRight.scale.set(1.05, 0.84, 1.08);
      const canopyTop = new Mesh(new SphereGeometry(0.56, 10, 10), foliageMaterial);
      canopyTop.position.set(0.02, 3.02, 0);
      canopyTop.scale.set(1, 0.85, 1);
      tree.add(canopyLeft, canopyRight, canopyTop);
    } else if (index % 5 === 3) {
      const coneWide = new Mesh(new ConeGeometry(1.02, 1.15, 12), foliageMaterial);
      coneWide.position.y = 2.12;
      coneWide.scale.set(1.02, 0.92, 1.05);
      const sphereCap = new Mesh(new SphereGeometry(0.52, 10, 10), foliageMaterial);
      sphereCap.position.y = 2.92;
      sphereCap.scale.set(1, 0.8, 1);
      tree.add(coneWide, sphereCap);
    } else {
      const canopyBottom = new Mesh(new SphereGeometry(1.02, 12, 12), foliageMaterial);
      canopyBottom.position.y = 2.2;
      canopyBottom.scale.set(1.14, 0.9, 1.03);
      const canopyMiddle = new Mesh(new SphereGeometry(0.8, 12, 12), foliageMaterial);
      canopyMiddle.position.y = 2.88;
      const canopyTop = new Mesh(new SphereGeometry(0.58, 12, 12), foliageMaterial);
      canopyTop.position.y = 3.42;
      tree.add(canopyBottom, canopyMiddle, canopyTop);
    }

    const variation = 0.8 + rand() * 0.5;
    tree.scale.set(variation, variation, variation);
    tree.add(trunk);

    tree.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    this.scene.add(tree);
  }

  private isPortalZone(position: Vector3, radius: number): boolean {
    return this.sectionStones.some((stone) => stone.position.distanceTo(position) < radius);
  }

  private addSectionStones(): void {
    if (!this.stoneSurfaceTexture) {
      this.stoneSurfaceTexture = this.createDirtPathTexture();
      this.stoneSurfaceTexture.wrapS = RepeatWrapping;
      this.stoneSurfaceTexture.wrapT = RepeatWrapping;
      this.stoneSurfaceTexture.repeat.set(1.75, 1.75);
      this.stoneSurfaceTexture.needsUpdate = true;
    }

    const ringRadius = 14;
    const ringAngles = [10, 82, 154, 226, 298].map((deg) => (deg * Math.PI) / 180);

    this.sections.forEach((section, index) => {
      const angle = ringAngles[index % ringAngles.length];
      const stonePosition = new Vector3(Math.cos(angle) * ringRadius, 0.02, Math.sin(angle) * ringRadius);

      const stoneShadow = new Mesh(
        new CircleGeometry(1.52, 32),
        new MeshBasicMaterial({ color: 0x213729, transparent: true, opacity: 0.12 })
      );
      stoneShadow.rotation.x = -Math.PI / 2;
      stoneShadow.position.set(stonePosition.x, 0.004, stonePosition.z);
      this.scene.add(stoneShadow);

      const stone = new Mesh(
        new CylinderGeometry(1.35, 1.45, 0.2, 32),
        new MeshStandardMaterial({ color: 0x8a7f69, roughness: 0.96, metalness: 0, flatShading: true })
      );

      stone.position.copy(stonePosition);
      stone.position.y = 0.11;
      stone.castShadow = true;
      stone.receiveShadow = true;
      this.scene.add(stone);

      const stoneTop = new Mesh(
        new CircleGeometry(1.24, 32),
        new MeshStandardMaterial({
          color: 0x9b8f79,
          map: this.stoneSurfaceTexture,
          roughness: 0.9,
          metalness: 0.02,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2
        })
      );
      stoneTop.rotation.x = -Math.PI / 2;
      stoneTop.position.set(stonePosition.x, 0.213, stonePosition.z);
      stoneTop.receiveShadow = true;
      this.scene.add(stoneTop);

      const stoneRim = new Mesh(
        new RingGeometry(1.23, 1.36, 32),
        new MeshBasicMaterial({ color: 0x6d6452 })
      );
      stoneRim.rotation.x = -Math.PI / 2;
      stoneRim.position.set(stonePosition.x, 0.216, stonePosition.z);
      this.scene.add(stoneRim);

      const centerMark = new Mesh(
        new CircleGeometry(0.28, 24),
        new MeshBasicMaterial({ color: parseInt(section.accentColor.replace('#', ''), 16) })
      );
      centerMark.rotation.x = -Math.PI / 2;
      centerMark.position.set(stonePosition.x, 0.218, stonePosition.z);
      this.scene.add(centerMark);

      this.addStoneDebris(stonePosition);

      this.sectionStones.push({
        section,
        position: stonePosition,
        mesh: stone
      });

      this.addSectionHologram(section, stonePosition);
    });
  }

  private addSectionHologram(section: PortfolioSection, stonePosition: Vector3): void {
    const machineGroup = new Group();
    machineGroup.position.set(stonePosition.x, 0.2, stonePosition.z);
    const accent = parseInt(section.accentColor.replace('#', ''), 16);

    const machineCore = new Mesh(
      new CylinderGeometry(0.28, 0.36, 0.12, 24),
      new MeshStandardMaterial({ color: 0x202836, roughness: 0.5, metalness: 0.45 })
    );
    machineCore.position.y = 0.06;

    const machineRing = new Mesh(
      new TorusGeometry(0.44, 0.04, 12, 28),
      new MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.7 })
    );
    machineRing.rotation.x = Math.PI / 2;
    machineRing.position.y = 0.14;

    const beam = new Mesh(
      new CylinderGeometry(0.11, 0.2, 1.45, 20),
      new MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.08,
        blending: AdditiveBlending,
        depthWrite: false
      })
    );
    beam.position.y = 0.86;

    const groundAura = new Mesh(
      new CircleGeometry(1.7, 30),
      new MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.1,
        blending: AdditiveBlending,
        depthWrite: false
      })
    );
    groundAura.rotation.x = -Math.PI / 2;
    groundAura.position.set(stonePosition.x, 0.219, stonePosition.z);
    this.scene.add(groundAura);

    const symbolPivot = new Group();
    symbolPivot.position.y = 1.62;

    const title = section.title.toUpperCase();
    const letterMeshes: Mesh[] = [];
    const letterMaterials: MeshBasicMaterial[] = [];
    const letterTextures: CanvasTexture[] = [];

    let cursorX = 0;
    const letterSpacing = 0.58;

    for (let i = 0; i < title.length; i += 1) {
      const character = title[i];

      if (character === ' ') {
        cursorX += letterSpacing * 0.62;
        continue;
      }

      const characterTexture = this.createCharacterTexture(character, section.accentColor);
      const characterMaterial = new MeshBasicMaterial({
        map: characterTexture,
        transparent: true,
        color: 0xffffff,
        side: DoubleSide,
        depthWrite: false,
        depthTest: false,
        opacity: 0.95
      });

      const letterMesh = new Mesh(new PlaneGeometry(0.68, 0.92), characterMaterial);
      letterMesh.position.x = cursorX;

      letterMeshes.push(letterMesh);
      letterMaterials.push(characterMaterial);
      letterTextures.push(characterTexture);
      cursorX += letterSpacing;
    }

    const totalWidth = Math.max(0, cursorX - letterSpacing);
    letterMeshes.forEach((mesh) => {
      mesh.position.x -= totalWidth / 2;
      symbolPivot.add(mesh);
    });

    symbolPivot.scale.set(1.9, 1.9, 1.9);

    machineGroup.add(machineCore, machineRing, beam, symbolPivot);
    this.scene.add(machineGroup);

    const sparkleMaterial = new MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.26, blending: AdditiveBlending, depthWrite: false });
    const sparkles: Mesh[] = [];

    for (let i = 0; i < 6; i += 1) {
      const sparkle = new Mesh(new CircleGeometry(0.05 + Math.random() * 0.03, 8), sparkleMaterial.clone());
      sparkle.rotation.x = -Math.PI / 2;
      sparkle.position.set(stonePosition.x, 0.4 + Math.random() * 1.2, stonePosition.z);
      this.scene.add(sparkle);
      sparkles.push(sparkle);
    }

    this.sectionHolograms.push({
      sectionId: section.id,
      group: machineGroup,
      symbolPivot,
      symbolMaterials: letterMaterials,
      symbolTextures: letterTextures,
      beam,
      ring: machineRing,
      groundAura,
      sparkles,
      phase: Math.random() * Math.PI * 2
    });
  }

  private createCharacterTexture(character: string, accentColor: string): CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    const context = canvas.getContext('2d');

    if (!context) {
      return new CanvasTexture(canvas);
    }

    const halo = context.createRadialGradient(128, 128, 20, 128, 128, 120);
    halo.addColorStop(0, 'rgba(255,255,255,0.26)');
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = halo;
    context.fillRect(0, 0, 256, 256);

    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '800 180px "Segoe UI", "Trebuchet MS", sans-serif';

    context.strokeStyle = accentColor;
    context.lineWidth = 10;
    context.strokeText(character, 128, 142);

    context.fillStyle = '#ffffff';
    context.fillText(character, 128, 138);

    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private addStoneDebris(stonePosition: Vector3): void {
    const debrisColors = [0x8f765f, 0x6f8661, 0x9e8468, 0x5f7458, 0x7a6650];
    const debrisCount = 22;

    for (let i = 0; i < debrisCount; i += 1) {
      const angle = (i / debrisCount) * Math.PI * 2 + Math.random() * 0.7;
      const distance = 1.45 + Math.random() * 1.35;
      const size = 0.08 + Math.random() * 0.18;
      const color = debrisColors[Math.floor(Math.random() * debrisColors.length)];

      const debris = new Mesh(
        new CircleGeometry(size, 10),
        new MeshBasicMaterial({ color, transparent: true, opacity: 0.7 })
      );

      debris.rotation.x = -Math.PI / 2;
      debris.rotation.z = Math.random() * Math.PI * 2;
      debris.position.set(
        stonePosition.x + Math.cos(angle) * distance,
        0.006 + (i % 3) * 0.001,
        stonePosition.z + Math.sin(angle) * distance
      );
      this.scene.add(debris);
    }
  }

  private createBrickWallTexture(): CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;

    const context = canvas.getContext('2d');

    if (!context) {
      return new CanvasTexture(canvas);
    }

    context.fillStyle = '#b58d6c';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const brickWidth = 86;
    const brickHeight = 40;

    for (let row = 0; row < Math.ceil(canvas.height / brickHeight); row += 1) {
      const rowOffset = row % 2 === 0 ? 0 : brickWidth / 2;

      for (let col = -1; col < Math.ceil(canvas.width / brickWidth) + 1; col += 1) {
        const x = col * brickWidth + rowOffset;
        const y = row * brickHeight;
        const tint = 130 + Math.floor(Math.random() * 34);

        context.fillStyle = `rgb(${tint + 35}, ${tint + 10}, ${tint - 8})`;
        context.fillRect(x + 2, y + 2, brickWidth - 4, brickHeight - 4);

        context.fillStyle = 'rgba(120, 92, 74, 0.25)';
        context.fillRect(x + 4, y + 4, brickWidth - 8, 8);
      }
    }

    for (let i = 0; i < 3400; i += 1) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const alpha = 0.03 + Math.random() * 0.07;
      context.fillStyle = `rgba(70, 52, 40, ${alpha})`;
      context.fillRect(x, y, 1.5, 1.5);
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(2.6, 1.1);
    texture.needsUpdate = true;

    return texture;
  }

  private createGroundTexture(): CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');

    if (!context) {
      return new CanvasTexture(canvas);
    }

    context.fillStyle = '#81966b';
    context.fillRect(0, 0, size, size);

    for (let i = 0; i < 70; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 26 + Math.random() * 58;
      const tone = 98 + Math.floor(Math.random() * 36);
      const alpha = 0.05 + Math.random() * 0.07;

      context.fillStyle = `rgba(${tone - 8}, ${tone + 18}, ${tone - 16}, ${alpha})`;
      context.beginPath();
      context.ellipse(x, y, radius * (0.8 + Math.random() * 0.4), radius * (0.75 + Math.random() * 0.45), Math.random() * Math.PI, 0, Math.PI * 2);
      context.fill();
    }

    for (let i = 0; i < 2500; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const bladeLength = 5 + Math.random() * 9;
      const direction = (Math.random() - 0.5) * 1.8;
      const green = 118 + Math.floor(Math.random() * 36);

      context.strokeStyle = `rgb(${70 + Math.floor(Math.random() * 16)}, ${green}, ${62 + Math.floor(Math.random() * 20)})`;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + direction, y - bladeLength);
      context.stroke();
    }

    for (let i = 0; i < 950; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 0.5 + Math.random() * 1.4;
      context.fillStyle = `rgba(${95 + Math.floor(Math.random() * 26)}, ${125 + Math.floor(Math.random() * 28)}, ${82 + Math.floor(Math.random() * 22)}, 0.32)`;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    for (let i = 0; i < 230; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const decalRadius = 2 + Math.random() * 4;
      const alpha = 0.06 + Math.random() * 0.1;

      context.fillStyle = `rgba(${68 + Math.floor(Math.random() * 20)}, ${98 + Math.floor(Math.random() * 24)}, ${54 + Math.floor(Math.random() * 20)}, ${alpha})`;
      context.beginPath();
      context.arc(x, y, decalRadius, 0, Math.PI * 2);
      context.fill();
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(10, 10);
    texture.needsUpdate = true;

    return texture;
  }

  private createDirtPathTexture(): CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');

    if (!context) {
      return new CanvasTexture(canvas);
    }

    context.fillStyle = '#807564';
    context.fillRect(0, 0, size, size);

    const mortar = '#5d5449';
    const rowHeight = 34;

    for (let row = 0; row < Math.ceil(size / rowHeight); row += 1) {
      const y = row * rowHeight;
      const offset = row % 2 === 0 ? 0 : 18;
      let x = -offset;

      while (x < size + 26) {
        const blockWidth = 22 + Math.random() * 28;
        const blockHeight = rowHeight - 3 - Math.random() * 4;
        const insetX = 1 + Math.random() * 1.4;
        const insetY = 1 + Math.random() * 1.4;
        const lightness = 106 + Math.floor(Math.random() * 34);
        const warmShift = Math.floor(Math.random() * 10);

        context.fillStyle = `rgb(${lightness + 6}, ${lightness - 1}, ${lightness - 10 - warmShift})`;
        context.fillRect(x + insetX, y + insetY, blockWidth - insetX * 2, blockHeight - insetY * 2);

        context.fillStyle = mortar;
        context.fillRect(x, y, blockWidth, 1);
        context.fillRect(x, y + blockHeight, blockWidth, 1);
        context.fillRect(x, y, 1, blockHeight + 1);
        context.fillRect(x + blockWidth, y, 1, blockHeight + 1);

        if (Math.random() > 0.55) {
          context.strokeStyle = `rgba(${80 + Math.floor(Math.random() * 24)}, ${76 + Math.floor(Math.random() * 20)}, ${70 + Math.floor(Math.random() * 16)}, 0.32)`;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(x + 3 + Math.random() * (blockWidth - 6), y + 2);
          context.lineTo(x + 3 + Math.random() * (blockWidth - 6), y + blockHeight - 2);
          context.stroke();
        }

        x += blockWidth;
      }
    }

    for (let i = 0; i < 1400; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const alpha = 0.06 + Math.random() * 0.12;
      const tone = 92 + Math.floor(Math.random() * 36);
      context.fillStyle = `rgba(${tone}, ${tone - 5}, ${tone - 11}, ${alpha})`;
      context.fillRect(x, y, 1.2 + Math.random() * 2.2, 1.2 + Math.random() * 2.2);
    }

    for (let i = 0; i < 280; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radiusX = 8 + Math.random() * 22;
      const radiusY = 4 + Math.random() * 14;
      context.fillStyle = `rgba(55, 49, 43, ${0.03 + Math.random() * 0.06})`;
      context.beginPath();
      context.ellipse(x, y, radiusX, radiusY, Math.random() * Math.PI, 0, Math.PI * 2);
      context.fill();
    }

    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(4.2, 4.2);
    texture.needsUpdate = true;
    return texture;
  }

  private addPlayer(): void {
    this.player = new Group();

    const limbMaterial = new MeshStandardMaterial({ color: 0x273143, roughness: 0.8, metalness: 0.03 });
    const bodyMaterial = new MeshStandardMaterial({ color: 0x374d68, roughness: 0.78, metalness: 0.04 });
    const accessoryMaterial = new MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.2, metalness: 0.95 });

    this.characterGroup = new Group();
    this.characterGroup.position.y = this.characterGroundOffset;

    const torso = new Mesh(new CylinderGeometry(0.23, 0.29, 1.18, 18), bodyMaterial);
    torso.name = 'playerTorso';
    torso.position.y = 1.06;

    const hip = new Mesh(new SphereGeometry(0.23, 16, 16), bodyMaterial);
    hip.position.y = 0.48;

    const upperChest = new Mesh(new SphereGeometry(0.28, 18, 18), bodyMaterial);
    upperChest.scale.set(1.2, 0.85, 1.05);
    upperChest.position.y = 1.28;

    const neck = new Mesh(new CylinderGeometry(0.08, 0.09, 0.18, 14), bodyMaterial);
    neck.position.y = 1.62;

    const shoulderBar = new Mesh(new CylinderGeometry(0.07, 0.08, 0.6, 14), bodyMaterial);
    shoulderBar.rotation.z = Math.PI / 2;
    shoulderBar.position.y = 1.45;

    const leftShoulder = new Mesh(new SphereGeometry(0.1, 12, 12), bodyMaterial);
    leftShoulder.position.set(-0.3, 1.43, 0);

    const rightShoulder = new Mesh(new SphereGeometry(0.1, 12, 12), bodyMaterial);
    rightShoulder.position.set(0.3, 1.43, 0);

    const head = new Mesh(
      new SphereGeometry(0.34, 24, 24),
      new MeshStandardMaterial({ color: 0xf0d4bd, roughness: 0.78, metalness: 0.02 })
    );
    head.name = 'playerHead';
    head.position.y = 1.9;

    const leftEar = new Mesh(new SphereGeometry(0.065, 12, 12), new MeshStandardMaterial({ color: 0xf0d4bd, roughness: 0.78, metalness: 0.02 }));
    leftEar.position.set(-0.33, 1.88, 0);
    const rightEar = new Mesh(new SphereGeometry(0.065, 12, 12), new MeshStandardMaterial({ color: 0xf0d4bd, roughness: 0.78, metalness: 0.02 }));
    rightEar.position.set(0.33, 1.88, 0);

    const headband = new Mesh(
      new TorusGeometry(0.49, 0.04, 14, 44, Math.PI),
      accessoryMaterial
    );
    headband.name = 'headbandArc';
    headband.position.set(0, 1.96, 0);

    const headbandInner = new Mesh(
      new TorusGeometry(0.45, 0.022, 12, 40, Math.PI),
      new MeshStandardMaterial({ color: 0x1f2835, roughness: 0.82, metalness: 0.05 })
    );
    headbandInner.name = 'headbandInnerArc';
    headbandInner.position.set(0, 1.95, 0.02);

    const leftConnector = new Mesh(
      new CylinderGeometry(0.022, 0.022, 0.24, 10),
      accessoryMaterial
    );
    leftConnector.name = 'leftHeadphoneConnector';
    leftConnector.position.set(-0.49, 1.86, 0.01);
    leftConnector.rotation.z = 0.06;

    const rightConnector = new Mesh(
      new CylinderGeometry(0.022, 0.022, 0.24, 10),
      accessoryMaterial
    );
    rightConnector.name = 'rightHeadphoneConnector';
    rightConnector.position.set(0.49, 1.86, 0.01);
    rightConnector.rotation.z = -0.06;

    const leftCup = new Mesh(
      new CylinderGeometry(0.16, 0.16, 0.1, 18),
      accessoryMaterial
    );
    leftCup.name = 'leftHeadphoneCup';
    leftCup.rotation.z = Math.PI / 2;
    leftCup.position.set(-0.43, 1.88, 0);

    const leftCupInner = new Mesh(
      new CylinderGeometry(0.12, 0.12, 0.04, 16),
      new MeshStandardMaterial({ color: 0x212a37, roughness: 0.9, metalness: 0 })
    );
    leftCupInner.name = 'leftHeadphoneCupInner';
    leftCupInner.rotation.z = Math.PI / 2;
    leftCupInner.position.set(-0.45, 1.88, 0);

    const rightCup = new Mesh(
      new CylinderGeometry(0.16, 0.16, 0.1, 18),
      accessoryMaterial
    );
    rightCup.name = 'rightHeadphoneCup';
    rightCup.rotation.z = Math.PI / 2;
    rightCup.position.set(0.43, 1.88, 0);

    const rightCupInner = new Mesh(
      new CylinderGeometry(0.12, 0.12, 0.04, 16),
      new MeshStandardMaterial({ color: 0x212a37, roughness: 0.9, metalness: 0 })
    );
    rightCupInner.name = 'rightHeadphoneCupInner';
    rightCupInner.rotation.z = Math.PI / 2;
    rightCupInner.position.set(0.45, 1.88, 0);

    this.leftArmPivot = new Group();
    this.leftArmPivot.name = 'leftArmPivot';
    this.leftArmPivot.position.set(-0.3, 1.43, 0);
    const leftArm = new Mesh(new CylinderGeometry(0.065, 0.065, 0.96, 12), limbMaterial);
    leftArm.position.y = -0.48;
    this.leftArmPivot.add(leftArm);

    const leftBicep = new Mesh(new SphereGeometry(0.09, 12, 12), limbMaterial);
    leftBicep.scale.set(1.1, 0.8, 1);
    leftBicep.position.y = -0.2;
    this.leftArmPivot.add(leftBicep);

    const leftHand = new Mesh(new SphereGeometry(0.07, 12, 12), limbMaterial);
    leftHand.position.y = -0.98;
    this.leftArmPivot.add(leftHand);

    this.rightArmPivot = new Group();
    this.rightArmPivot.name = 'rightArmPivot';
    this.rightArmPivot.position.set(0.3, 1.43, 0);
    const rightArm = new Mesh(new CylinderGeometry(0.065, 0.065, 0.96, 12), limbMaterial);
    rightArm.position.y = -0.48;
    this.rightArmPivot.add(rightArm);

    const rightBicep = new Mesh(new SphereGeometry(0.09, 12, 12), limbMaterial);
    rightBicep.scale.set(1.1, 0.8, 1);
    rightBicep.position.y = -0.2;
    this.rightArmPivot.add(rightBicep);

    const rightHand = new Mesh(new SphereGeometry(0.07, 12, 12), limbMaterial);
    rightHand.position.y = -0.98;
    this.rightArmPivot.add(rightHand);

    this.leftLegPivot = new Group();
    this.leftLegPivot.name = 'leftLegPivot';
    this.leftLegPivot.position.set(-0.15, 0.44, 0);
    const leftLeg = new Mesh(new CylinderGeometry(0.075, 0.085, 1.06, 12), limbMaterial);
    leftLeg.position.y = -0.53;
    this.leftLegPivot.add(leftLeg);

    const leftCalf = new Mesh(new SphereGeometry(0.09, 12, 12), limbMaterial);
    leftCalf.scale.set(0.9, 1.25, 0.8);
    leftCalf.position.y = -0.72;
    this.leftLegPivot.add(leftCalf);

    const leftFoot = new Mesh(new BoxGeometry(0.2, 0.08, 0.34), limbMaterial);
    leftFoot.position.set(0, -1.07, 0.07);
    this.leftLegPivot.add(leftFoot);

    this.rightLegPivot = new Group();
    this.rightLegPivot.name = 'rightLegPivot';
    this.rightLegPivot.position.set(0.15, 0.44, 0);
    const rightLeg = new Mesh(new CylinderGeometry(0.075, 0.085, 1.06, 12), limbMaterial);
    rightLeg.position.y = -0.53;
    this.rightLegPivot.add(rightLeg);

    const rightCalf = new Mesh(new SphereGeometry(0.09, 12, 12), limbMaterial);
    rightCalf.scale.set(0.9, 1.25, 0.8);
    rightCalf.position.y = -0.72;
    this.rightLegPivot.add(rightCalf);

    const rightFoot = new Mesh(new BoxGeometry(0.2, 0.08, 0.34), limbMaterial);
    rightFoot.position.set(0, -1.07, 0.07);
    this.rightLegPivot.add(rightFoot);

    this.characterGroup.add(
      torso,
      hip,
      upperChest,
      neck,
      shoulderBar,
      leftShoulder,
      rightShoulder,
      head,
      leftEar,
      rightEar,
      headband,
      headbandInner,
      leftConnector,
      rightConnector,
      leftCup,
      leftCupInner,
      rightCup,
      rightCupInner,
      this.leftArmPivot,
      this.rightArmPivot,
      this.leftLegPivot,
      this.rightLegPivot
    );

    this.characterGroup.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    this.player.add(this.characterGroup);
    const spawnX = -6.5;
    const spawnZ = 3.2;
    this.player.position.set(spawnX, this.getSurfaceHeight(spawnX, spawnZ) + this.playerGroundClearance, spawnZ);
    this.scene.add(this.player);
  }


  private registerInputEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.attachVisualViewportListeners();
  }

  private readonly onVisualViewportChange = (): void => {
    this.updateViewportCssVariable();
    this.handleResize();
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.isExperienceStarted) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === 'w' || key === 'a' || key === 's' || key === 'd' || key === 'shift') {
      event.preventDefault();
      this.keys.add(key);
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.key.toLowerCase());
  };

  private readonly handleResize = (): void => {
    this.updateViewportCssVariable();

    const container = this.sceneContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width <= 0 || height <= 0) {
      if (!this.resizeRetryFrameId) {
        this.resizeRetryFrameId = requestAnimationFrame(() => {
          this.resizeRetryFrameId = undefined;
          this.handleResize();
        });
      }

      return;
    }

    const aspect = width / height;

    this.camera.left = (-this.worldViewSize * aspect) / 2;
    this.camera.right = (this.worldViewSize * aspect) / 2;
    this.camera.top = this.worldViewSize / 2;
    this.camera.bottom = -this.worldViewSize / 2;
    this.camera.near = 0.01;
    this.camera.far = 500;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.updateTouchJoystickAvailability(width);
    this.updateJoystickViewportOffset();
  };

  private updateViewportCssVariable(): void {
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty('--app-viewport-height', `${Math.round(viewportHeight)}px`);
  }

  private scheduleInitialViewportStabilization(): void {
    const syncViewport = (): void => {
      this.updateViewportCssVariable();
      this.handleResize();
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(syncViewport);
    });

    [120, 360, 800].forEach((delay) => {
      const timeoutId = window.setTimeout(syncViewport, delay);
      this.initialViewportSyncTimeoutIds.push(timeoutId);
    });
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    if (this.isExperienceStarted) {
      this.updatePlayerPosition(delta);
    }

    this.updatePlayerAnimation(delta);
    this.updateFootsteps(delta);
    this.updateSectionHolograms(delta);
    this.updateForestPlaqueIndicator();
    this.updateAmbientLife(delta);
    if (this.isExperienceStarted) {
      this.updateSectionInteraction();
    } else {
      this.infoPanelTargetOpacity = 0;
    }

    this.updateInfoPanel(delta);
    this.updateCamera();
    this.syncUiBindings();
    this.renderer.render(this.scene, this.camera);
  };

  private syncUiBindings(): void {
    const needsUiSync = this.showIntroButton || this.activePanelSection !== undefined || this.infoPanelOpacity > 0.001 || this.infoPanelTargetOpacity > 0 || this.isTouchJoystickActive;
    if (!needsUiSync) {
      return;
    }

    const now = performance.now();
    if (now - this.lastUiSyncTimeMs < this.uiSyncIntervalMs) {
      return;
    }

    this.lastUiSyncTimeMs = now;
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });
  }

  private updatePlayerPosition(delta: number): void {
    const move = new Vector3();
    const cameraForward = new Vector3();
    const cameraRight = new Vector3();

    this.camera.getWorldDirection(cameraForward);
    cameraForward.y = 0;

    if (cameraForward.lengthSq() > 0) {
      cameraForward.normalize();
    }

    cameraRight.crossVectors(cameraForward, this.upVector);

    if (cameraRight.lengthSq() > 0) {
      cameraRight.normalize();
    }

    if (this.keys.has('w')) {
      move.add(cameraForward);
    }

    if (this.keys.has('s')) {
      move.sub(cameraForward);
    }

    if (this.keys.has('a')) {
      move.sub(cameraRight);
    }

    if (this.keys.has('d')) {
      move.add(cameraRight);
    }

    if (this.joystickInput.lengthSq() > 0.0001) {
      move.addScaledVector(cameraRight, this.joystickInput.x);
      move.addScaledVector(cameraForward, this.joystickInput.z);
    }

    if (move.lengthSq() > 0) {
      this.isRunning = this.keys.has('shift');
      this.isMoving = true;

      const movementStrength = Math.min(1, move.length());
      move.normalize();
      this.lastMoveDirection.copy(move);

      const speed = this.isRunning ? this.playerSpeed * 1.55 : this.playerSpeed;
      this.player.position.add(move.multiplyScalar(speed * delta * movementStrength));
    } else {
      this.isMoving = false;
      this.isRunning = false;
    }

    this.clampPlayerInsideWorld();
    this.player.position.y = this.getSurfaceHeight(this.player.position.x, this.player.position.z) + this.playerGroundClearance;
  }

  private clampPlayerInsideWorld(): void {
    const limit = this.worldSize / 2 - this.playerRadius;
    this.player.position.x = Math.max(-limit, Math.min(limit, this.player.position.x));
    this.player.position.z = Math.max(-limit, Math.min(limit, this.player.position.z));
  }

  private getGroundHeight(x: number, z: number): number {
    const radial = Math.hypot(x, z) / (this.worldSize * 0.5);
    const waveA = Math.sin(x * 0.22) * Math.cos(z * 0.18) * 0.055;
    const waveB = Math.sin((x + z) * 0.3) * 0.03;
    const edgeDrop = Math.max(0, radial - 0.78) * 0.16;
    return waveA + waveB - edgeDrop - 0.01;
  }

  private getSurfaceHeight(x: number, z: number): number {
    const terrainHeight = this.getGroundHeight(x, z);

    if (this.isOnPatioOrRoad(new Vector3(x, 0, z), 0)) {
      return Math.max(terrainHeight, this.patioRoadSurfaceHeight);
    }

    return terrainHeight;
  }

  private updatePlayerAnimation(delta: number): void {
    this.animationElapsed += delta;

    if (this.isMoving) {
      const pace = this.isRunning ? 12 : 7.2;
      const phase = this.animationElapsed * pace;
      const armSwing = Math.sin(phase) * (this.isRunning ? 0.72 : 0.58);
      const legSwing = Math.sin(phase) * (this.isRunning ? 0.84 : 0.66);
      const sideSwing = Math.sin(phase + Math.PI / 2) * (this.isRunning ? 0.12 : 0.08);
      const torsoTwist = Math.sin(phase) * (this.isRunning ? 0.11 : 0.08);
      const bob = Math.abs(Math.sin(phase * 2)) * (this.isRunning ? 0.095 : 0.055);

      this.leftArmPivot.rotation.x = armSwing;
      this.rightArmPivot.rotation.x = -armSwing;
      this.leftArmPivot.rotation.z = 0.09 + sideSwing;
      this.rightArmPivot.rotation.z = -0.09 - sideSwing;
      this.leftLegPivot.rotation.x = -legSwing;
      this.rightLegPivot.rotation.x = legSwing;
      this.characterGroup.position.y = this.characterGroundOffset + bob;
      this.characterGroup.rotation.z = sideSwing * 0.22;
      this.characterGroup.rotation.y = torsoTwist;
      this.player.rotation.y = Math.atan2(this.lastMoveDirection.x, this.lastMoveDirection.z);
      return;
    }

    this.leftArmPivot.rotation.x *= 0.86;
    this.rightArmPivot.rotation.x *= 0.86;
    this.leftArmPivot.rotation.z *= 0.84;
    this.rightArmPivot.rotation.z *= 0.84;
    this.leftLegPivot.rotation.x *= 0.86;
    this.rightLegPivot.rotation.x *= 0.86;
    this.characterGroup.position.y = this.characterGroundOffset;
    this.characterGroup.rotation.z *= 0.84;
    this.characterGroup.rotation.y *= 0.84;
  }

  private updateFootsteps(delta: number): void {
    for (let i = this.footsteps.length - 1; i >= 0; i -= 1) {
      const footstep = this.footsteps[i];
      footstep.age += delta;

      const progress = Math.min(footstep.age / footstep.maxAge, 1);
      const material = footstep.mesh.material as MeshBasicMaterial;
      material.opacity = (1 - progress) * 0.24;

      const scale = 1 + progress * 0.75;
      footstep.mesh.scale.setScalar(scale);

      if (progress >= 1) {
        this.scene.remove(footstep.mesh);
        footstep.mesh.geometry.dispose();
        material.dispose();
        this.footsteps.splice(i, 1);
      }
    }

    if (!this.isMoving) {
      this.footstepTimer = 0;
      return;
    }

    this.footstepTimer += delta;
    const stepInterval = this.isRunning ? 0.14 : 0.23;

    if (this.footstepTimer >= stepInterval) {
      this.footstepTimer = 0;
      this.spawnFootstep();
    }
  }

  private spawnFootstep(): void {
    const sideVector = new Vector3().crossVectors(this.lastMoveDirection, this.upVector).normalize();
    const sideOffset = this.nextFootIsLeft ? -0.28 : 0.28;

    const footstep = new Mesh(
      new CircleGeometry(0.15, 16),
      new MeshBasicMaterial({ color: 0x1c1c1c, transparent: true, opacity: 0.24 })
    );

    footstep.rotation.x = -Math.PI / 2;
    footstep.position.copy(this.player.position);
    footstep.position.add(sideVector.multiplyScalar(sideOffset));
    footstep.position.y = 0.012;

    this.scene.add(footstep);
    this.footsteps.push({ mesh: footstep, age: 0, maxAge: 0.9 });
    this.nextFootIsLeft = !this.nextFootIsLeft;
  }

  private updateSectionHolograms(delta: number): void {
    this.hologramElapsed += delta;

    this.sectionHolograms.forEach((hologram) => {
      const stone = this.sectionStones.find((entry) => entry.section.id === hologram.sectionId);
      const distance = stone ? this.player.position.distanceTo(stone.position) : 100;
      const proximity = Math.max(0, Math.min(1, 1 - (distance - 2.2) / 4.5));

      const hover = Math.sin(this.hologramElapsed * 1.6 + hologram.phase);
      const pulse = 0.78 + (Math.sin(this.hologramElapsed * 2.1 + hologram.phase) + 1) * 0.06;
      const nearBoost = proximity * 0.42;

      hologram.symbolPivot.position.y = 1.63 + hover * 0.09;
      hologram.symbolPivot.quaternion.copy(this.camera.quaternion);
      hologram.symbolPivot.scale.setScalar(1.9 + (pulse - 0.78) * 0.2 + nearBoost);

      const beamMaterial = hologram.beam.material as MeshBasicMaterial;
      beamMaterial.opacity = 0.06 + (pulse - 0.78) * 0.24 + proximity * 0.14;

      const ringMaterial = hologram.ring.material as MeshBasicMaterial;
      ringMaterial.opacity = 0.62 + proximity * 0.28;
      hologram.ring.scale.setScalar(1 + proximity * 0.16);

      const auraMaterial = hologram.groundAura.material as MeshBasicMaterial;
      auraMaterial.opacity = 0.08 + proximity * 0.23;
      hologram.groundAura.scale.setScalar(1 + proximity * 0.38 + (Math.sin(this.hologramElapsed * 2.8 + hologram.phase) + 1) * 0.08);

      hologram.symbolMaterials.forEach((material) => {
        material.opacity = pulse + proximity * 0.16;
      });

      hologram.sparkles.forEach((sparkle, index) => {
        const sparkleMaterial = sparkle.material as MeshBasicMaterial;
        const phase = this.hologramElapsed * (1.5 + index * 0.08) + hologram.phase + index;
        const radius = 0.72 + proximity * 0.35;
        sparkle.position.x = hologram.group.position.x + Math.cos(phase) * radius;
        sparkle.position.z = hologram.group.position.z + Math.sin(phase) * radius;
        sparkle.position.y = 0.5 + (index % 3) * 0.3 + Math.sin(phase * 1.4) * 0.2;
        sparkleMaterial.opacity = 0.14 + proximity * 0.46;
      });
    });
  }

  private updateAmbientLife(delta: number): void {
    this.updateFountain(delta);
    this.updateGamingNpc(delta);
    this.updateDjNpc(delta);
    this.updateSocialCircleNpcs(delta);
    this.updateHandballScene(delta);

    this.butterflies.forEach((butterfly) => {
      butterfly.phase += delta * butterfly.speed;
      butterfly.group.position.x = butterfly.center.x + Math.cos(butterfly.phase * 1.4) * butterfly.radius;
      butterfly.group.position.z = butterfly.center.z + Math.sin(butterfly.phase * 1.1) * butterfly.radius;
      butterfly.group.position.y = butterfly.center.y + Math.sin(butterfly.phase * 2.3) * 0.25;

      const flap = Math.sin(butterfly.phase * 18) * 0.75;
      butterfly.leftWing.rotation.y = flap;
      butterfly.rightWing.rotation.y = -flap;
      butterfly.group.rotation.y = Math.atan2(
        Math.cos(butterfly.phase * 1.1) * butterfly.radius,
        -Math.sin(butterfly.phase * 1.4) * butterfly.radius
      );
    });

    this.birds.forEach((bird) => {
      bird.phase += delta;
      bird.group.position.addScaledVector(bird.heading, bird.speed * delta);
      bird.group.position.y += Math.sin(bird.phase * 2.1) * 0.01;
      bird.group.rotation.y = Math.atan2(bird.heading.x, bird.heading.z);

      const wingFlap = Math.sin(bird.phase * 9) * 0.65;
      bird.leftWing.rotation.z = wingFlap;
      bird.rightWing.rotation.z = -wingFlap;

      if (bird.group.position.x > this.worldSize / 2 + 12) {
        bird.group.position.x = -this.worldSize / 2 - 12;
        bird.group.position.z = -10 + Math.random() * 20;
        bird.group.position.y = 8.2 + Math.random() * 2.2;
      }
    });

    this.floatingParticles.forEach((particle) => {
      particle.phase += delta;
      particle.mesh.position.x += particle.drift.x * delta;
      particle.mesh.position.z += particle.drift.z * delta;
      particle.mesh.position.y = particle.baseY + Math.sin(particle.phase * 1.4) * 0.16;

      if (Math.abs(particle.mesh.position.x) > this.worldSize / 2 - 2) {
        particle.mesh.position.x *= -0.9;
      }

      if (Math.abs(particle.mesh.position.z) > this.worldSize / 2 - 2) {
        particle.mesh.position.z *= -0.9;
      }
    });

    this.grassTufts.forEach((tuft) => {
      tuft.phase += delta;
      tuft.group.rotation.z = Math.sin(tuft.phase * 1.7) * 0.05;
      tuft.group.rotation.x = Math.cos(tuft.phase * 1.3) * 0.03;
    });
  }

  private updateGamingNpc(delta: number): void {
    if (!this.gamingNpc) {
      return;
    }

    this.gamingNpc.phase += delta;
    const fastTap = Math.sin(this.gamingNpc.phase * 13.5);
    const breathing = Math.sin(this.gamingNpc.phase * 2.2);

    this.gamingNpc.leftArmPivot.rotation.x = -1.16 + fastTap * 0.08;
    this.gamingNpc.rightArmPivot.rotation.x = -1.18 - fastTap * 0.08;
    this.gamingNpc.leftArmPivot.rotation.z = 0.22 + Math.sin(this.gamingNpc.phase * 4.8) * 0.03;
    this.gamingNpc.rightArmPivot.rotation.z = -0.22 - Math.sin(this.gamingNpc.phase * 4.8) * 0.03;

    this.gamingNpc.leftLegPivot.rotation.x = -1.5 + Math.sin(this.gamingNpc.phase * 5.8) * 0.025;
    this.gamingNpc.rightLegPivot.rotation.x = -1.5 - Math.sin(this.gamingNpc.phase * 5.8) * 0.025;

    this.gamingNpc.torso.rotation.x = 0.2 + breathing * 0.025;
    this.gamingNpc.head.rotation.x = -0.03 + Math.sin(this.gamingNpc.phase * 3.6) * 0.03;
    this.gamingNpc.head.rotation.y = Math.sin(this.gamingNpc.phase * 2.7) * 0.02;

    const flicker = 0.72 + (Math.sin(this.gamingNpc.phase * 10.5) + 1) * 0.14;
    this.gamingNpc.screenMaterial.color.setRGB(0.35 + flicker * 0.2, 0.75 + flicker * 0.12, 1);
  }

  private updateDjNpc(delta: number): void {
    if (!this.djNpc) {
      return;
    }

    this.djNpc.phase += delta;
    const beat = this.djNpc.phase * 8.4;
    const nodWave = Math.sin(beat);
    const nodSnap = Math.sign(nodWave) * Math.pow(Math.abs(nodWave), 0.45);
    const headBang = nodSnap * 0.5 + Math.sin(beat * 2.7) * 0.16;
    const shoulderPulse = Math.sin(beat + Math.PI / 2) * 0.1;

    this.djNpc.leftArmPivot.rotation.x = -1.42 + Math.sin(beat * 1.34) * 0.2;
    this.djNpc.rightArmPivot.rotation.x = -1.34 - Math.sin(beat * 1.58) * 0.24;
    this.djNpc.leftArmPivot.rotation.z = 0.46 + shoulderPulse;
    this.djNpc.rightArmPivot.rotation.z = -0.44 - shoulderPulse;

    this.djNpc.leftLegPivot.rotation.x = -0.24;
    this.djNpc.rightLegPivot.rotation.x = 0.22;

    this.djNpc.torso.rotation.x = 0.14 + Math.abs(headBang) * 0.18;
    this.djNpc.torso.rotation.y = Math.sin(beat * 0.52) * 0.13;
    this.djNpc.head.rotation.x = -0.22 + headBang;
    this.djNpc.head.rotation.y = Math.sin(beat * 0.62) * 0.14;

    const pulse = 0.64 + (Math.sin(beat * 2.4) + 1) * 0.18;
    this.djNpc.screenMaterial.color.setRGB(0.26 + pulse * 0.22, 0.65 + pulse * 0.2, 0.92 + pulse * 0.08);
  }

  private updateSocialCircleNpcs(delta: number): void {
    if (this.socialCircleNpcs.length === 0) {
      return;
    }

    const stableDelta = Math.min(delta, 1 / 30);

    this.socialCircleNpcs.forEach((entry, index) => {
      entry.phase += stableDelta * entry.talkSpeed;

      const turnTaking = (Math.sin(entry.phase * 0.68 + index * 1.37) + 1) * 0.5;
      const speaking = Math.min(1, Math.max(0, turnTaking * 1.15 + entry.speakingBias - 0.55));
      const idle = 1 - speaking;
      const gestureMain = Math.sin(entry.phase * 2.4 + index * 0.45) * 0.18 * entry.emphasis;
      const gestureFollow = Math.sin(entry.phase * 1.7 + index * 0.9) * 0.14 * entry.emphasis;

      entry.npc.leftArmPivot.rotation.x = entry.baseLeftArmX + gestureMain * (0.4 + speaking * 0.95) + speaking * 0.12;
      entry.npc.rightArmPivot.rotation.x = entry.baseRightArmX - gestureFollow * (0.38 + speaking * 0.9) + speaking * 0.08;
      entry.npc.leftArmPivot.rotation.z = 0.14 + Math.sin(entry.phase * 1.5 + speaking) * 0.05 + speaking * 0.12;
      entry.npc.rightArmPivot.rotation.z = -0.14 - Math.sin(entry.phase * 1.45 + 0.3) * 0.05 - speaking * 0.09;

      const weightShift = Math.sin(entry.phase * 0.86 + index * 0.42) * 0.08;
      const bodyBob = Math.sin(entry.phase * (1.1 + speaking * 0.45)) * 0.01;
      const targetY = entry.baseY + bodyBob;
      const smoothing = Math.min(1, stableDelta * 10 + 0.18);
      entry.npc.group.position.y += (targetY - entry.npc.group.position.y) * smoothing;

      entry.npc.torso.rotation.x = 0.02 + speaking * 0.08 + Math.abs(gestureMain) * 0.08;
      entry.npc.torso.rotation.y = weightShift + Math.sin(entry.phase * 0.55 + index) * 0.05;
      entry.npc.torso.rotation.z = Math.sin(entry.phase * 0.75 + index * 0.3) * 0.035;

      entry.npc.head.rotation.x = -0.02 + speaking * 0.06 + Math.sin(entry.phase * 1.2 + index) * 0.03;
      entry.npc.head.rotation.y = Math.sin(entry.phase * 0.95 + index * 0.48) * (0.08 + speaking * 0.14);

      entry.npc.group.rotation.y = entry.baseYaw + Math.sin(entry.phase * 0.52 + index) * (0.06 + speaking * 0.11);
      entry.npc.leftLegPivot.rotation.x = -0.06 + weightShift * 0.8 + idle * -0.02;
      entry.npc.rightLegPivot.rotation.x = 0.06 - weightShift * 0.8 + idle * 0.02;
    });
  }

  private resetHandballCycle(scene: HandballScene): void {
    scene.phase = 0;
    scene.shotDirection = -0.58 + Math.random() * 1.16;
    scene.shotHeight = 1.0 + Math.random() * 0.36;
    scene.shotScored = Math.random() > 0.22;
    scene.shotArc = 0.62 + Math.random() * 0.32;
  }

  private updateHandballScene(delta: number): void {
    if (!this.handballScene) {
      return;
    }

    const scene = this.handballScene;
    scene.phase += delta;
    if (scene.phase >= scene.cycleDuration) {
      this.resetHandballCycle(scene);
    }

    const stepOneEnd = 0.44;
    const stepTwoEnd = 0.86;
    const stepThreeEnd = 1.26;
    const jumpEnd = 1.72;
    const release = 1.49;
    const flightEnd = 2.24;
    const goalLineZ = scene.goalLineZ;
    const keeperBaseX = scene.goalkeeperBase.x;
    const keeperBaseZ = scene.goalkeeperBase.z;

    const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
    const segment = (value: number, start: number, end: number): number => clamp01((value - start) / Math.max(0.01, end - start));
    const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

    let lateralOffset = 0;
    let forwardOffset = 0;
    if (scene.phase <= stepOneEnd) {
      const t = segment(scene.phase, 0, stepOneEnd);
      lateralOffset = lerp(0, -0.26, t);
      forwardOffset = lerp(0, -0.32, t);
    } else if (scene.phase <= stepTwoEnd) {
      const t = segment(scene.phase, stepOneEnd, stepTwoEnd);
      lateralOffset = lerp(-0.26, 0.16, t);
      forwardOffset = lerp(-0.32, -0.66, t);
    } else if (scene.phase <= stepThreeEnd) {
      const t = segment(scene.phase, stepTwoEnd, stepThreeEnd);
      lateralOffset = lerp(0.16, -0.2, t);
      forwardOffset = lerp(-0.66, -1.0, t);
    } else {
      const t = segment(scene.phase, stepThreeEnd, release);
      lateralOffset = lerp(-0.2, -0.08, t);
      forwardOffset = lerp(-1.0, -1.18, t);
    }

    const jumpProgress = segment(scene.phase, stepThreeEnd, jumpEnd);
    const jumpLift = Math.sin(jumpProgress * Math.PI) * 0.42;
    const shooterX = scene.shooterStart.x + lateralOffset;
    const shooterZ = scene.shooterStart.z + forwardOffset;
    const shooterGroundY = this.getSurfaceHeight(shooterX, shooterZ) + this.playerGroundClearance;
    scene.shooter.group.position.set(
      scene.shooterStart.x + lateralOffset,
      shooterGroundY + jumpLift,
      scene.shooterStart.z + forwardOffset
    );
    scene.shooter.group.rotation.y = 2.3 + lateralOffset * -0.2;

    const runProgress = segment(scene.phase, 0, stepThreeEnd);
    const throwSnap = segment(scene.phase, stepThreeEnd, release);
    const postThrow = segment(scene.phase, release, release + 0.36);
    const ballFlight = segment(scene.phase, release, flightEnd);

    const runnerStride = Math.sin(runProgress * Math.PI * 3) * 0.66 * (1 - jumpProgress * 0.46);
    scene.shooter.leftLegPivot.rotation.x = -runnerStride;
    scene.shooter.rightLegPivot.rotation.x = runnerStride;
    scene.shooter.torso.rotation.x = 0.06 + runProgress * 0.2 - throwSnap * 0.28;
    scene.shooter.torso.rotation.y = 0.04 + runProgress * 0.3 - throwSnap * 0.4;
    scene.shooter.head.rotation.y = -0.08 + scene.shotDirection * 0.16;

    const leftArmHoldX = -2.12 + runProgress * 0.08;
    const leftArmDropX = -0.5;
    scene.shooter.leftArmPivot.rotation.x = leftArmHoldX + (leftArmDropX - leftArmHoldX) * postThrow;
    const leftArmHoldZ = 0.44;
    const leftArmDropZ = 0.2;
    scene.shooter.leftArmPivot.rotation.z = leftArmHoldZ + (leftArmDropZ - leftArmHoldZ) * postThrow;
    scene.shooter.rightArmPivot.rotation.x = -0.16 + Math.sin(runProgress * Math.PI * 3 + Math.PI) * 0.32;
    scene.shooter.rightArmPivot.rotation.z = -0.2 - runProgress * 0.14;

    const keeperReact = segment(scene.phase, release + 0.02, release + 0.58);
    const keeperTravel = scene.shotDirection * 0.82;
    const keeperJump = Math.max(0, scene.shotHeight - 0.98) * 0.58;
    scene.goalkeeper.group.position.x = keeperBaseX + keeperTravel * keeperReact;
    scene.goalkeeper.group.position.y = this.getSurfaceHeight(scene.goalkeeper.group.position.x, keeperBaseZ) + this.playerGroundClearance + Math.sin(keeperReact * Math.PI) * keeperJump;
    scene.goalkeeper.group.position.z = keeperBaseZ;
    scene.goalkeeper.group.rotation.y = -0.2 - keeperTravel * 0.14 * keeperReact;

    scene.goalkeeper.leftArmPivot.rotation.x = -1.2 - keeperReact * 0.18;
    scene.goalkeeper.rightArmPivot.rotation.x = -1.2 - keeperReact * 0.18;
    scene.goalkeeper.leftArmPivot.rotation.z = 0.98 + keeperReact * 0.26;
    scene.goalkeeper.rightArmPivot.rotation.z = -0.98 - keeperReact * 0.26;
    scene.goalkeeper.leftLegPivot.rotation.x = 0.14 + keeperReact * 0.32;
    scene.goalkeeper.rightLegPivot.rotation.x = -0.14 - keeperReact * 0.32;
    scene.goalkeeper.torso.rotation.z = keeperTravel * 0.18 * keeperReact;
    scene.goalkeeper.head.rotation.y = -scene.shotDirection * 0.55;

    scene.shooter.group.updateMatrixWorld(true);
    const throwHandPosition = scene.shooter.leftArmPivot.localToWorld(new Vector3(-0.02, -0.95, 0.1));

    if (scene.phase < release) {
      scene.ball.position.copy(throwHandPosition);
      scene.ball.position.y += Math.sin(runProgress * Math.PI * 3) * 0.02;
    } else if (scene.phase <= flightEnd) {
      const targetX = scene.goalCenterX + scene.shotDirection;
      const targetY = scene.center.y + scene.shotHeight;
      const targetZ = scene.shotScored ? goalLineZ - 0.7 : goalLineZ + 0.24;
      const control = new Vector3(
        scene.goalCenterX + scene.shotDirection * 0.5,
        scene.center.y + scene.shotHeight + scene.shotArc,
        scene.center.z + 0.35
      );

      const inv = 1 - ballFlight;
      scene.ball.position.set(
        inv * inv * throwHandPosition.x + 2 * inv * ballFlight * control.x + ballFlight * ballFlight * targetX,
        inv * inv * throwHandPosition.y + 2 * inv * ballFlight * control.y + ballFlight * ballFlight * targetY,
        inv * inv * throwHandPosition.z + 2 * inv * ballFlight * control.z + ballFlight * ballFlight * targetZ
      );
    } else {
      if (scene.shotScored) {
        const settle = Math.min(1, (scene.phase - flightEnd) / 0.56);
        scene.ball.position.set(
          scene.goalCenterX + scene.shotDirection * 0.84,
          scene.center.y + 0.5 + (1 - settle) * 0.28,
          goalLineZ - 0.72
        );
      } else {
        const drop = Math.min(1, (scene.phase - flightEnd) / 0.62);
        scene.ball.position.set(
          scene.goalCenterX + scene.shotDirection * 0.44,
          scene.center.y + 1.02 - drop * 0.86,
          goalLineZ + 0.26 - drop * 0.18
        );
      }
    }

    scene.ball.rotation.x += delta * 8;
    scene.ball.rotation.z += delta * 5.8;

    const netKick = scene.shotScored && scene.phase > flightEnd && scene.phase < flightEnd + 0.44
      ? 1 - (scene.phase - flightEnd) / 0.44
      : 0;
    const meshOpacity = 0.58 + netKick * 0.24;
    scene.netMaterials.forEach((material) => {
      material.opacity = meshOpacity;
    });
  }

  private updateFountain(delta: number): void {
    this.fountainElapsed += delta;

    if (this.fountainWaterSurface) {
      const waterMaterial = this.fountainWaterSurface.material as MeshStandardMaterial;
      this.fountainWaterSurface.position.y = 0.52 + Math.sin(this.fountainElapsed * 2.2) * 0.012;
      waterMaterial.opacity = 0.8 + Math.sin(this.fountainElapsed * 1.7) * 0.06;
    }

    this.fountainJets.forEach((jet, index) => {
      const oscillation = Math.sin(this.fountainElapsed * (2.4 + index * 0.15) + jet.phase);
      const scaleY = 0.82 + (oscillation + 1) * 0.24;
      jet.mesh.scale.y = scaleY;
      jet.mesh.position.y = jet.baseY + Math.sin(this.fountainElapsed * 2 + jet.phase) * 0.06;

      const jetMaterial = jet.mesh.material as MeshBasicMaterial;
      jetMaterial.opacity = 0.42 + (oscillation + 1) * 0.12;
    });

    this.fountainRipples.forEach((ripple, index) => {
      const pulse = (this.fountainElapsed * 0.72 + index * 0.42) % 1;
      const scale = 1 + pulse * 1.55;
      ripple.scale.set(scale, scale, scale);

      const material = ripple.material as MeshBasicMaterial;
      material.opacity = (1 - pulse) * 0.24;
    });
  }

  private getQuadraticPoint(start: Vector3, control: Vector3, end: Vector3, t: number): Vector3 {
    const invT = 1 - t;
    const x = invT * invT * start.x + 2 * invT * t * control.x + t * t * end.x;
    const z = invT * invT * start.z + 2 * invT * t * control.z + t * t * end.z;
    return new Vector3(x, 0.01, z);
  }

  private getQuadraticTangent(start: Vector3, control: Vector3, end: Vector3, t: number): Vector3 {
    const x = 2 * (1 - t) * (control.x - start.x) + 2 * t * (end.x - control.x);
    const z = 2 * (1 - t) * (control.z - start.z) + 2 * t * (end.z - control.z);
    return new Vector3(x, 0, z);
  }

  private updateSectionInteraction(): void {
    let nearestStone: SectionStone | undefined;
    let nearestSection: PortfolioSection | undefined;
    let nearestAnchor = new Vector3();
    let nearestDistance = Number.POSITIVE_INFINITY;

    this.sectionStones.forEach((stone) => {
      const distance = this.player.position.distanceTo(stone.position);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestStone = stone;
        nearestSection = stone.section;
        nearestAnchor.copy(stone.position);
      }
    });

    this.forestPlaqueTriggers.forEach((trigger) => {
      const plaqueDistance = this.player.position.distanceTo(trigger.position);
      if (plaqueDistance < nearestDistance && plaqueDistance <= trigger.triggerRadius) {
        nearestDistance = plaqueDistance;
        nearestStone = undefined;
        nearestSection = trigger.panelSection;
        nearestAnchor.copy(trigger.position);
      }
    });

    if (!nearestSection || (!nearestStone && this.forestPlaqueTriggers.length === 0) || (nearestStone && nearestDistance > this.stoneTriggerRadius)) {
      this.activeSectionId = undefined;
      this.infoPanelTargetOpacity = 0;
      return;
    }

    this.infoPanelAnchor.set(nearestAnchor.x, 0, nearestAnchor.z);
    this.infoPanelTargetOpacity = 1;

    if (this.activeSectionId === nearestSection.id) {
      return;
    }

    this.activeSectionId = nearestSection.id;
    this.showInfoPanel(nearestSection);
  }

  private updateForestPlaqueIndicator(): void {
    if (this.forestPlaqueTriggers.length === 0) {
      return;
    }

    this.forestPlaqueTriggers.forEach((trigger) => {
      const distance = this.player.position.distanceTo(trigger.position);
      const proximity = Math.max(0, Math.min(1, 1 - (distance - 1.4) / 4.2));
      const pulse = (Math.sin(this.hologramElapsed * 3 + trigger.phase) + 1) * 0.5;

      const standOutlineMaterial = trigger.standOutline.material as MeshBasicMaterial;
      standOutlineMaterial.opacity = 0.18 + proximity * 0.62;
      const standScale = 1.03 + proximity * 0.2 + pulse * 0.07;
      trigger.standOutline.scale.set(standScale, standScale, standScale);

      const plateOutlineMaterial = trigger.plateOutline.material as MeshBasicMaterial;
      plateOutlineMaterial.opacity = 0.26 + proximity * 0.66;
      trigger.plateOutline.scale.set(
        1.04 + proximity * 0.26 + pulse * 0.08,
        1.04 + proximity * 0.14 + pulse * 0.03,
        1.07 + proximity * 0.33 + pulse * 0.09
      );
    });
  }

  private showInfoPanel(section: PortfolioSection): void {
    if (this.activePanelSection?.id === section.id) {
      return;
    }

    this.activePanelSection = section;
  }

  private hideInfoPanel(): void {
    this.activePanelSection = undefined;
  }

  private updateInfoPanel(delta: number): void {
    const deltaOpacity = this.infoPanelFadeSpeed * delta;

    if (this.infoPanelOpacity < this.infoPanelTargetOpacity) {
      this.infoPanelOpacity = Math.min(this.infoPanelTargetOpacity, this.infoPanelOpacity + deltaOpacity);
    } else if (this.infoPanelOpacity > this.infoPanelTargetOpacity) {
      this.infoPanelOpacity = Math.max(this.infoPanelTargetOpacity, this.infoPanelOpacity - deltaOpacity);
    }

    if (this.activePanelSection) {
      const container = this.sceneContainer.nativeElement;
      this.infoPanelScreenX = container.clientWidth * 0.5;
      this.infoPanelScreenY = container.clientHeight * 0.5;
    }

    if (this.infoPanelTargetOpacity === 0 && this.infoPanelOpacity <= 0.001) {
      this.hideInfoPanel();
    }
  }

  private updateCamera(): void {
    this.cameraFollowPosition.set(
      this.player.position.x + this.cameraOffset.x,
      this.player.position.y + this.cameraOffset.y,
      this.player.position.z + this.cameraOffset.z
    );
    this.cameraFollowLookTarget.set(this.player.position.x, this.followLookHeight, this.player.position.z);

    this.camera.position.copy(this.cameraFollowPosition);
    this.camera.lookAt(this.cameraFollowLookTarget);
    this.setCameraZoom(this.followCameraZoom);
  }

  private setCameraZoom(zoom: number): void {
    if (Math.abs(this.currentCameraZoom - zoom) <= 0.0005) {
      return;
    }

    this.currentCameraZoom = zoom;
    this.camera.zoom = zoom;
    this.camera.updateProjectionMatrix();
  }

  private updateTouchJoystickAvailability(viewportWidth: number): void {
    const isNarrowViewport = viewportWidth <= 900;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    this.showTouchJoystick = isNarrowViewport || hasCoarsePointer;

    if (!this.showTouchJoystick) {
      this.resetTouchJoystick();
    }
  }

  private attachVisualViewportListeners(): void {
    const viewport = window.visualViewport;
    if (!viewport || this.visualViewportListenersAttached) {
      return;
    }

    viewport.addEventListener('resize', this.onVisualViewportChange);
    viewport.addEventListener('scroll', this.onVisualViewportChange);
    this.visualViewportListenersAttached = true;
  }

  private detachVisualViewportListeners(): void {
    const viewport = window.visualViewport;
    if (!viewport || !this.visualViewportListenersAttached) {
      return;
    }

    viewport.removeEventListener('resize', this.onVisualViewportChange);
    viewport.removeEventListener('scroll', this.onVisualViewportChange);
    this.visualViewportListenersAttached = false;
  }

  private updateJoystickViewportOffset(): void {
    const viewport = window.visualViewport;
    if (!viewport) {
      this.joystickViewportBottomOffset = 0;
      return;
    }

    const occludedBottom = Math.max(0, window.innerHeight - (viewport.height + viewport.offsetTop));
    this.joystickViewportBottomOffset = Math.round(occludedBottom);
  }

  public onJoystickPointerDown(event: PointerEvent): void {
    if (!this.isExperienceStarted || !this.showTouchJoystick) {
      return;
    }

    const joystick = this.touchJoystick;
    if (!joystick) {
      return;
    }

    this.joystickPointerId = event.pointerId;
    this.isTouchJoystickActive = true;
    joystick.nativeElement.setPointerCapture(event.pointerId);
    this.updateJoystickFromPointer(event);
    event.preventDefault();
  }

  public onJoystickPointerMove(event: PointerEvent): void {
    if (!this.isTouchJoystickActive || event.pointerId !== this.joystickPointerId) {
      return;
    }

    this.updateJoystickFromPointer(event);
    event.preventDefault();
  }

  public onJoystickPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.joystickPointerId) {
      return;
    }

    const joystick = this.touchJoystick;
    if (joystick?.nativeElement.hasPointerCapture(event.pointerId)) {
      joystick.nativeElement.releasePointerCapture(event.pointerId);
    }

    this.resetTouchJoystick();
    event.preventDefault();
  }

  private updateJoystickFromPointer(event: PointerEvent): void {
    const joystick = this.touchJoystick;
    if (!joystick) {
      return;
    }

    const rect = joystick.nativeElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxTravel = Math.max(20, rect.width * 0.29);

    const rawDx = event.clientX - centerX;
    const rawDy = event.clientY - centerY;
    const rawDistance = Math.hypot(rawDx, rawDy);
    const clampedDistance = Math.min(maxTravel, rawDistance);
    const directionX = rawDistance > 0 ? rawDx / rawDistance : 0;
    const directionY = rawDistance > 0 ? rawDy / rawDistance : 0;
    const clampedDx = directionX * clampedDistance;
    const clampedDy = directionY * clampedDistance;

    this.joystickKnobOffsetX = clampedDx;
    this.joystickKnobOffsetY = clampedDy;
    this.joystickInput.set(clampedDx / maxTravel, 0, -clampedDy / maxTravel);
  }

  private resetTouchJoystick(): void {
    this.isTouchJoystickActive = false;
    this.joystickPointerId = undefined;
    this.joystickKnobOffsetX = 0;
    this.joystickKnobOffsetY = 0;
    this.joystickInput.set(0, 0, 0);
  }

}
