import {it,expect} from 'vitest';
import {Game} from '../src/game';
import {distance, type Point} from '../src/city';
function walk(game:Game,target:Point){for(let i=0;i<1500&&distance(game.view().player,target)>2;i++){const p=game.view().player;game.update(1/60,{right:p.x<target.x-1,left:p.x>target.x+1,down:p.y<target.y-1,up:p.y>target.y+1});}expect(distance(game.view().player,target)).toBeLessThan(4);}
function walkRoad(game:Game,target:Point){const p=game.view().player;walk(game,{x:p.x,y:1140});walk(game,{x:target.x,y:1140});walk(game,target);}
function drive(game:Game,target:Point){
 const start=game.view(),car=start.cars.find(c=>c.id===start.player.vehicle)!;
 const reverse=Math.cos(Math.atan2(target.y-car.y,target.x-car.x)-car.angle)<.2;
 for(let i=0;i<4200;i++){
  const s=game.view(),c=s.cars.find(c=>c.id===s.player.vehicle)!,d=distance(c,target);
  if(d<40&&Math.abs(c.speed)<10)return;
  const desired=Math.atan2(target.y-c.y,target.x-c.x)+(reverse?Math.PI:0),error=Math.atan2(Math.sin(desired-c.angle),Math.cos(desired-c.angle));
  const steering=error*(reverse?-1:1);
  game.update(1/120,{up:!reverse&&d>48,down:reverse&&d>48,left:steering<-.03,right:steering>.03,brake:(d<65&&Math.abs(c.speed)>10)||(Math.abs(error)>.8&&Math.abs(c.speed)>70)});
 }
 expect(distance(game.view().player,target)).toBeLessThan(40);
}
it('the full campaign completes using only movement, vehicle interaction and objective commands',()=>{
 const g=new Game();g.command('interact');walkRoad(g,{x:1460,y:820});g.command('interact');expect(g.view().completed).toBe(1);expect(g.view().money).toBe(450);
 g.command('recover');g.command('interact');walkRoad(g,{x:1140,y:180});g.command('interact');expect(g.view().stage).toBe(1);expect(g.view().player.vehicle).toBe('sunbird');
 drive(g,{x:1140,y:1140});drive(g,{x:180,y:1140});g.command('interact');expect(g.view().completed).toBe(2);expect(g.view().money).toBe(1150);
 g.command('recover');g.command('interact');walkRoad(g,{x:820,y:820});g.command('interact');expect(g.view().heat).toBe(2);expect(g.view().stage).toBe(1);
 walkRoad(g,{x:180,y:1140});for(let i=0;i<1600&&g.view().stage===1;i++)g.update(1/60);expect(g.view().heat).toBe(0);g.command('interact');expect(g.view().completed).toBe(3);
 g.command('recover');g.command('interact');walkRoad(g,{x:1460,y:180});g.command('interact');walk(g,{x:1460,y:1140});g.command('interact');expect(g.view().stage).toBe(2);walk(g,{x:180,y:1140});for(let i=0;i<2000&&g.view().stage===2;i++)g.update(1/60);g.command('interact');expect(g.view().completed).toBe(4);expect(g.view().money).toBe(3650);
 for(let i=0;i<10;i++)g.command('interact');expect(g.view().money).toBe(3650);expect(g.view().active).toBe(false);expect(new Game(g.save()).view().completed).toBe(4);
});
