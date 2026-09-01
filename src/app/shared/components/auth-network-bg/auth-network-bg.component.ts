import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  ViewChild
} from '@angular/core';

interface NetNode {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  pulse: number;
  pulseSpeed: number;
  kind: 'solo' | 'group';
  size: number;
}

interface NetEdge {
  a: number;
  b: number;
}

interface Packet {
  edge: number;
  t: number;
  speed: number;
  dir: 1 | -1;
  hueShift: number;
}

/**
 * Lightweight 2.5D canvas backdrop: antenna-style nodes linked by wires,
 * with message bubbles traveling along graph edges. Palette-only colors.
 * No Three.js — canvas 2D for Angular 10 / low cost.
 */
@Component({
  selector: 'app-auth-network-bg',
  templateUrl: './auth-network-bg.component.html',
  styleUrls: ['./auth-network-bg.component.scss']
})
export class AuthNetworkBgComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D | null = null;
  private rafId = 0;
  private nodes: NetNode[] = [];
  private edges: NetEdge[] = [];
  private packets: Packet[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;
  private time = 0;
  private reducedMotion = false;
  private running = false;
  private lastTs = 0;

  // Palette
  private readonly arctic = '#F1F6F4';
  private readonly forsytha = '#FFC801';
  private readonly nocturnal = '#114C5A';
  private readonly mystic = '#D9E8E2';
  private readonly saffron = '#FF9932';
  private readonly oceanic = '#172B36';

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    this.resize();
    this.buildGraph();
    this.zone.runOutsideAngular(() => {
      this.running = true;
      this.lastTs = performance.now();
      this.tick(this.lastTs);
    });
  }

  ngOnDestroy(): void {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resize();
    this.buildGraph();
  }

  private resize(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement || canvas;
    const rect = parent.getBoundingClientRect();
    this.width = Math.max(320, Math.floor(rect.width || window.innerWidth));
    this.height = Math.max(320, Math.floor(rect.height || window.innerHeight));
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(this.width * this.dpr);
    canvas.height = Math.floor(this.height * this.dpr);
    canvas.style.width = `${this.width}px`;
    canvas.style.height = `${this.height}px`;
    if (this.ctx) {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
  }

  private buildGraph(): void {
    const w = this.width;
    const h = this.height;
    const count = w < 700 ? 10 : w < 1100 ? 14 : 18;
    this.nodes = [];
    this.edges = [];
    this.packets = [];

    // Spread nodes in a soft grid with jitter (antenna field)
    const cols = Math.ceil(Math.sqrt(count * (w / h)));
    const rows = Math.ceil(count / cols);
    let i = 0;
    for (let r = 0; r < rows && i < count; r++) {
      for (let c = 0; c < cols && i < count; c++) {
        const nx = (c + 0.5) / cols;
        const ny = (r + 0.45) / rows;
        const jitterX = (Math.sin(i * 12.9898) * 0.5 + 0.5) * 0.12 - 0.06;
        const jitterY = (Math.cos(i * 78.233) * 0.5 + 0.5) * 0.1 - 0.05;
        const x = (nx + jitterX) * w;
        const y = (ny + jitterY) * h * 0.92 + h * 0.04;
        const z = 0.35 + ((i * 37) % 100) / 100 * 0.65;
        this.nodes.push({
          x,
          y,
          z,
          baseX: x,
          baseY: y,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.6 + Math.random() * 0.8,
          kind: i % 5 === 0 ? 'group' : 'solo',
          size: 5 + z * 7
        });
        i++;
      }
    }

    // Connect nearest neighbors → mesh (1:1 + group clusters)
    const maxDist = Math.min(w, h) * 0.38;
    for (let a = 0; a < this.nodes.length; a++) {
      const dists: { b: number; d: number }[] = [];
      for (let b = a + 1; b < this.nodes.length; b++) {
        const dx = this.nodes[a].x - this.nodes[b].x;
        const dy = this.nodes[a].y - this.nodes[b].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < maxDist) {
          dists.push({ b, d });
        }
      }
      dists.sort((p, q) => p.d - q.d);
      const links = this.nodes[a].kind === 'group' ? 3 : 2;
      for (let k = 0; k < Math.min(links, dists.length); k++) {
        this.edges.push({ a, b: dists[k].b });
      }
    }

    // Ensure connectivity: ring fallback
    if (this.edges.length < this.nodes.length - 1) {
      for (let a = 0; a < this.nodes.length - 1; a++) {
        this.edges.push({ a, b: a + 1 });
      }
    }

    const packetCount = Math.min(10, Math.max(4, Math.floor(this.edges.length / 2)));
    for (let p = 0; p < packetCount; p++) {
      this.packets.push({
        edge: p % this.edges.length,
        t: Math.random(),
        speed: 0.08 + Math.random() * 0.12,
        dir: Math.random() > 0.5 ? 1 : -1,
        hueShift: Math.random()
      });
    }
  }

  private tick(ts: number): void {
    if (!this.running) {
      return;
    }
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
    this.lastTs = ts;
    if (!this.reducedMotion) {
      this.time += dt;
      this.update(dt);
    }
    this.draw();
    this.rafId = requestAnimationFrame((t) => this.tick(t));
  }

  private update(dt: number): void {
    // Gentle float of towers
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      n.pulse += n.pulseSpeed * dt;
      n.x = n.baseX + Math.sin(this.time * 0.35 + i) * 4 * n.z;
      n.y = n.baseY + Math.cos(this.time * 0.28 + i * 0.7) * 3 * n.z;
    }

    for (let i = 0; i < this.packets.length; i++) {
      const p = this.packets[i];
      p.t += p.speed * dt * p.dir;
      if (p.t >= 1) {
        p.t = 1;
        p.dir = -1;
        // hop to a random edge sharing endpoint
        this.hopPacket(p, true);
      } else if (p.t <= 0) {
        p.t = 0;
        p.dir = 1;
        this.hopPacket(p, false);
      }
    }
  }

  private hopPacket(p: Packet, atEnd: boolean): void {
    const e = this.edges[p.edge];
    if (!e) {
      p.edge = Math.floor(Math.random() * this.edges.length);
      return;
    }
    const nodeIdx = atEnd ? e.b : e.a;
    const candidates: number[] = [];
    for (let i = 0; i < this.edges.length; i++) {
      const ed = this.edges[i];
      if (ed.a === nodeIdx || ed.b === nodeIdx) {
        candidates.push(i);
      }
    }
    if (!candidates.length) {
      return;
    }
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    p.edge = next;
    const ne = this.edges[next];
    if (ne.a === nodeIdx) {
      p.t = 0;
      p.dir = 1;
    } else {
      p.t = 1;
      p.dir = -1;
    }
  }

  private draw(): void {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }
    const w = this.width;
    const h = this.height;

    // Base wash: oceanic → nocturnal
    const g = ctx.createLinearGradient(0, 0, w * 0.2, h);
    g.addColorStop(0, this.oceanic);
    g.addColorStop(0.55, this.nocturnal);
    g.addColorStop(1, '#0c3a45');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Soft arctic vignette / mint haze
    const rg = ctx.createRadialGradient(w * 0.7, h * 0.2, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    rg.addColorStop(0, 'rgba(217, 232, 226, 0.14)');
    rg.addColorStop(0.45, 'rgba(241, 246, 244, 0.04)');
    rg.addColorStop(1, 'rgba(23, 43, 54, 0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);

    // Ground plane grid (subtle perspective lines)
    this.drawGround(ctx, w, h);

    // Depth-sort nodes for painter order
    const order = this.nodes
      .map((n, idx) => ({ idx, z: n.z }))
      .sort((a, b) => a.z - b.z);

    // Wires first (behind tall towers slightly — draw all wires then nodes)
    ctx.lineCap = 'round';
    for (let i = 0; i < this.edges.length; i++) {
      this.drawEdge(ctx, this.edges[i], i);
    }

    // Packets on wires
    for (let i = 0; i < this.packets.length; i++) {
      this.drawPacket(ctx, this.packets[i]);
    }

    // Antenna towers / nodes
    for (let o = 0; o < order.length; o++) {
      this.drawNode(ctx, this.nodes[order[o].idx]);
    }
  }

  private drawGround(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(217, 232, 226, 0.07)';
    ctx.lineWidth = 1;
    const baseY = h * 0.78;
    for (let i = 0; i < 8; i++) {
      const y = baseY + i * (h * 0.04);
      const inset = i * w * 0.03;
      ctx.beginPath();
      ctx.moveTo(inset, y);
      ctx.lineTo(w - inset, y);
      ctx.stroke();
    }
    // vanishing rays
    ctx.strokeStyle = 'rgba(241, 246, 244, 0.05)';
    const cx = w * 0.5;
    for (let i = -6; i <= 6; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * 18, baseY);
      ctx.lineTo(cx + i * (w * 0.12), h);
      ctx.stroke();
    }
    ctx.restore();
  }

  private edgePoints(e: NetEdge): { x0: number; y0: number; x1: number; y1: number; mx: number; my: number } {
    const a = this.nodes[e.a];
    const b = this.nodes[e.b];
    const x0 = a.x;
    const y0 = a.y - a.size * 2.2;
    const x1 = b.x;
    const y1 = b.y - b.size * 2.2;
    // slight arc for "wire" feel
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2 - Math.abs(x1 - x0) * 0.08 - 12;
    return { x0, y0, x1, y1, mx, my };
  }

  private drawEdge(ctx: CanvasRenderingContext2D, e: NetEdge, edgeIdx: number): void {
    const { x0, y0, x1, y1, mx, my } = this.edgePoints(e);
    const a = this.nodes[e.a];
    const b = this.nodes[e.b];
    const depth = (a.z + b.z) / 2;

    ctx.save();
    // glow
    ctx.strokeStyle = `rgba(255, 200, 1, ${0.08 + depth * 0.1})`;
    ctx.lineWidth = 3.5 + depth * 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(mx, my, x1, y1);
    ctx.stroke();

    // core wire
    const mintA = 0.25 + depth * 0.35;
    ctx.strokeStyle = `rgba(217, 232, 226, ${mintA})`;
    ctx.lineWidth = 1.1 + depth * 0.9;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(mx, my, x1, y1);
    ctx.stroke();

    // dashed data pulse along wire (static pattern drifting)
    if (!this.reducedMotion) {
      ctx.setLineDash([4, 10]);
      ctx.lineDashOffset = -this.time * 28 - edgeIdx * 5;
      ctx.strokeStyle = `rgba(255, 153, 50, ${0.15 + depth * 0.2})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(mx, my, x1, y1);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  private pointOnEdge(e: NetEdge, t: number): { x: number; y: number } {
    const { x0, y0, x1, y1, mx, my } = this.edgePoints(e);
    const u = 1 - t;
    // quadratic bezier
    const x = u * u * x0 + 2 * u * t * mx + t * t * x1;
    const y = u * u * y0 + 2 * u * t * my + t * t * y1;
    return { x, y };
  }

  private drawPacket(ctx: CanvasRenderingContext2D, p: Packet): void {
    const e = this.edges[p.edge];
    if (!e) {
      return;
    }
    const { x, y } = this.pointOnEdge(e, p.t);
    const warm = p.hueShift > 0.45;
    const fill = warm ? this.forsytha : this.saffron;
    const stroke = warm ? this.saffron : this.forsytha;

    ctx.save();
    // soft glow
    ctx.beginPath();
    ctx.fillStyle = warm ? 'rgba(255, 200, 1, 0.22)' : 'rgba(255, 153, 50, 0.2)';
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();

    // message bubble
    const bw = 22;
    const bh = 16;
    this.roundRect(ctx, x - bw / 2, y - bh / 2, bw, bh, 6);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();

    // tiny tail
    ctx.beginPath();
    ctx.moveTo(x - 3, y + bh / 2 - 1);
    ctx.lineTo(x, y + bh / 2 + 5);
    ctx.lineTo(x + 4, y + bh / 2 - 1);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    // dots inside bubble
    ctx.fillStyle = this.oceanic;
    for (let d = 0; d < 3; d++) {
      ctx.beginPath();
      ctx.arc(x - 5 + d * 5, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawNode(ctx: CanvasRenderingContext2D, n: NetNode): void {
    const s = n.size;
    const pulse = 1 + Math.sin(n.pulse) * 0.06;
    const mastH = s * (n.kind === 'group' ? 5.2 : 4.2) * pulse;
    const baseY = n.y;
    const topY = n.y - mastH;

    ctx.save();

    // ground disc shadow
    ctx.beginPath();
    ctx.ellipse(n.x, baseY + 4, s * 1.6, s * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(23, 43, 54, 0.35)';
    ctx.fill();

    // mast
    const mastGrad = ctx.createLinearGradient(n.x, topY, n.x, baseY);
    mastGrad.addColorStop(0, this.mystic);
    mastGrad.addColorStop(1, this.nocturnal);
    ctx.strokeStyle = mastGrad;
    ctx.lineWidth = 2 + n.z * 1.5;
    ctx.beginPath();
    ctx.moveTo(n.x, baseY);
    ctx.lineTo(n.x, topY);
    ctx.stroke();

    // cross-arms (antenna)
    ctx.strokeStyle = `rgba(241, 246, 244, ${0.35 + n.z * 0.35})`;
    ctx.lineWidth = 1.2;
    const arm = s * 1.8;
    ctx.beginPath();
    ctx.moveTo(n.x - arm, topY + s * 0.8);
    ctx.lineTo(n.x + arm, topY + s * 0.8);
    ctx.moveTo(n.x - arm * 0.7, topY + s * 1.6);
    ctx.lineTo(n.x + arm * 0.7, topY + s * 1.6);
    ctx.stroke();

    // dish / node head
    if (n.kind === 'group') {
      // cluster of three small orbs = group chat
      const offsets = [-s * 0.85, 0, s * 0.85];
      for (let k = 0; k < 3; k++) {
        this.drawOrb(ctx, n.x + offsets[k], topY - (k === 1 ? s * 0.35 : 0), s * 0.55, k === 1);
      }
    } else {
      this.drawOrb(ctx, n.x, topY, s * 0.85, true);
    }

    // ring ping
    if (!this.reducedMotion) {
      const ping = (Math.sin(n.pulse) * 0.5 + 0.5);
      ctx.beginPath();
      ctx.arc(n.x, topY, s * (1.4 + ping * 1.8), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 200, 1, ${0.12 * (1 - ping)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawOrb(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, accent: boolean): void {
    const grd = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    if (accent) {
      grd.addColorStop(0, this.forsytha);
      grd.addColorStop(0.55, this.saffron);
      grd.addColorStop(1, this.nocturnal);
    } else {
      grd.addColorStop(0, this.arctic);
      grd.addColorStop(0.5, this.mystic);
      grd.addColorStop(1, this.nocturnal);
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.strokeStyle = 'rgba(241, 246, 244, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
}
