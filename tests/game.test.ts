import { describe, it, expect } from 'vitest';
import { Game } from '../src/game';

describe('courier movement', () => {
  it('walking for one second has the same outcome at 30 and 120Hz', () => {
    const slow = new Game(), fast = new Game();
    for(let i=0;i<30;i++) slow.update(1/30,{right:true});
    for(let i=0;i<120;i++) fast.update(1/120,{right:true});
    expect(slow.view().player.x).toBeCloseTo(fast.view().player.x,1);
    expect(slow.view().player.x).toBeGreaterThan(230);
  });
});

describe('progress integrity',()=>{
 it('rejects forged rewards and resets no completed jobs on a corrupt load',()=>{
  const game=new Game('{"version":1,"completed":1,"money":450}');
  expect(game.load('{"version":1,"completed":4,"money":999999}')).toBe(false);
  expect(game.load('{broken')).toBe(false);
  expect(game.view().completed).toBe(1);
 });
 it('retry is unavailable until a job fails, and elapsed timeout preserves rewards',()=>{
  const game=new Game();game.command('interact');game.command('retry');
  for(let i=0;i<401;i++)game.update(.25);
  expect(game.view().failed).toBe(true);
  game.command('retry');expect(game.view().active).toBe(true);expect(game.view().remaining).toBe(100);expect(game.view().money).toBe(0);
 });
 it('loading valid progress cancels any active job and its timer',()=>{
  const game=new Game();game.command('interact');game.update(1);
  expect(game.load('{"version":1,"completed":1,"money":450}')).toBe(true);
  expect(game.view().remaining).toBe(0);
 });
});
