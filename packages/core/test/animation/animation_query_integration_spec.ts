/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {AUTO_STYLE, AnimationPlayer, animate, animateChild, query, stagger, state, style, transition, trigger, ɵAnimationGroupPlayer as AnimationGroupPlayer} from '@angular/animations';
import {AnimationDriver, ɵAnimationEngine} from '@angular/animations/browser';
import {matchesElement} from '@angular/animations/browser/src/render/shared';
import {MockAnimationDriver, MockAnimationPlayer} from '@angular/animations/browser/testing';
import {CommonModule} from '@angular/common';
import {Component, HostBinding, ViewChild} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {HostListener} from '../../src/metadata/directives';
import {TestBed} from '../../testing';
import {fakeAsync, flushMicrotasks} from '../../testing/src/fake_async';


export function main() {
  // these tests are only mean't to be run within the DOM (for now)
  if (typeof Element == 'undefined') return;

  describe('animation query tests', function() {
    function getLog(): MockAnimationPlayer[] {
      return MockAnimationDriver.log as MockAnimationPlayer[];
    }

    function resetLog() { MockAnimationDriver.log = []; }

    beforeEach(() => {
      resetLog();
      TestBed.configureTestingModule({
        providers: [{provide: AnimationDriver, useClass: MockAnimationDriver}],
        imports: [BrowserAnimationsModule, CommonModule]
      });
    });

    describe('query()', () => {
      it('should be able to query all animation triggers via `@*`', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div [@parent]="exp0">
              <div class="a" [@a]="exp1"></div>
              <div class="b" [@b]="exp2"></div>
              <section>
                <div class="c" @c></div>
              </section>
            </div>
          `,
          animations: [
            trigger(
                'parent',
                [
                  transition(
                      '* => *',
                      [
                        query(
                            '@*:animating',
                            [
                              animate(1000, style({background: 'red'})),
                            ]),
                      ]),
                ]),
            trigger(
                'a',
                [
                  transition('* => *', []),
                ]),
            trigger(
                'b',
                [
                  transition('* => *', []),
                ]),
            trigger(
                'c',
                [
                  transition('* => *', []),
                ])
          ]
        })
        class Cmp {
          public exp0: any;
          public exp1: any;
          public exp2: any;
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        cmp.exp0 = 1;
        cmp.exp1 = 1;
        cmp.exp2 = 1;
        fixture.detectChanges();
        engine.flush();

        const players = getLog();
        expect(players.length).toEqual(3);
        const [p1, p2, p3] = players;

        expect(p1.element.classList.contains('a')).toBeTruthy();
        expect(p2.element.classList.contains('b')).toBeTruthy();
        expect(p3.element.classList.contains('c')).toBeTruthy();
      });

      it('should be able to query triggers directly by name', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div [@myAnimation]="exp0">
              <div class="f1" @foo></div>
              <div class="f2" [@foo]></div>
              <div class="f3" [@foo]="exp1"></div>
              <div class="b1" @bar></div>
              <div class="b2" [@bar]></div>
              <div class="b3" [@bar]="exp2"></div>
            </div>
          `,
          animations: [
            trigger('foo', []),
            trigger('bar', []),
            trigger(
                'myAnimation',
                [
                  transition(
                      '* => foo',
                      [
                        query(
                            '@foo',
                            [
                              animate(1000, style({color: 'red'})),
                            ]),
                      ]),
                  transition(
                      '* => bar',
                      [
                        query(
                            '@bar',
                            [
                              animate(1000, style({color: 'blue'})),
                            ]),
                      ])
                ]),
          ]
        })
        class Cmp {
          public exp0: any;
          public exp1: any;
          public exp2: any;
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        fixture.detectChanges();
        engine.flush();
        resetLog();

        cmp.exp0 = 'foo';
        fixture.detectChanges();
        engine.flush();

        let players = getLog();
        expect(players.length).toEqual(3);
        const [p1, p2, p3] = players;
        resetLog();

        expect(p1.element.classList.contains('f1')).toBeTruthy();
        expect(p2.element.classList.contains('f2')).toBeTruthy();
        expect(p3.element.classList.contains('f3')).toBeTruthy();

        cmp.exp0 = 'bar';
        fixture.detectChanges();
        engine.flush();

        players = getLog();
        expect(players.length).toEqual(3);
        const [p4, p5, p6] = players;
        resetLog();

        expect(p4.element.classList.contains('b1')).toBeTruthy();
        expect(p5.element.classList.contains('b2')).toBeTruthy();
        expect(p6.element.classList.contains('b3')).toBeTruthy();
      });

      it('should be able to query all active animations using :animating in a query', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div [@myAnimation]="exp" #parent>
              <div *ngFor="let item of items" class="item e-{{ item }}">
              </div>
            </div>
          `,
          animations: [
            trigger(
                'myAnimation',
                [
                  transition(
                      '* => a',
                      [
                        query(
                            '.item:nth-child(odd)',
                            [
                              style({opacity: 0}),
                              animate(1000, style({opacity: 1})),
                            ]),
                      ]),
                  transition(
                      '* => b',
                      [
                        query(
                            '.item:animating',
                            [
                              style({opacity: 1}),
                              animate(1000, style({opacity: 0})),
                            ]),
                      ]),
                ]),
          ]
        })
        class Cmp {
          public exp: any;
          public items: number[] = [0, 1, 2, 3, 4];
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        cmp.exp = 'a';
        fixture.detectChanges();
        engine.flush();

        let players = getLog();
        expect(players.length).toEqual(3);
        resetLog();

        cmp.exp = 'b';
        fixture.detectChanges();
        engine.flush();

        players = getLog();
        expect(players.length).toEqual(3);
        expect(players[0].element.classList.contains('e-0')).toBeTruthy();
        expect(players[1].element.classList.contains('e-2')).toBeTruthy();
        expect(players[2].element.classList.contains('e-4')).toBeTruthy();
      });

      it('should be able to query all actively queued animation triggers via `@*:animating`',
         () => {
           @Component({
             selector: 'ani-cmp',
             template: `
            <div [@parent]="exp0">
              <div class="c1" [@child]="exp1"></div>
              <div class="c2" [@child]="exp2"></div>
              <div class="c3" [@child]="exp3"></div>
              <div class="c4" [@child]="exp4"></div>
              <div class="c5" [@child]="exp5"></div>
            </div>
          `,
             animations: [
               trigger(
                   'parent',
                   [
                     transition(
                         '* => *',
                         [
                           query(
                               '@*:animating', [animate(1000, style({background: 'red'}))],
                               {optional: true}),
                         ]),
                   ]),
               trigger(
                   'child',
                   [
                     transition('* => *', []),
                   ])
             ]
           })
           class Cmp {
             public exp0: any;
             public exp1: any;
             public exp2: any;
             public exp3: any;
             public exp4: any;
             public exp5: any;
           }

           TestBed.configureTestingModule({declarations: [Cmp]});

           const engine = TestBed.get(ɵAnimationEngine);
           const fixture = TestBed.createComponent(Cmp);
           const cmp = fixture.componentInstance;

           cmp.exp0 = 0;

           cmp.exp1 = 0;
           cmp.exp2 = 0;
           cmp.exp3 = 0;
           cmp.exp4 = 0;
           cmp.exp5 = 0;
           fixture.detectChanges();
           engine.flush();

           let players = engine.players;
           cancelAllPlayers(players);

           cmp.exp0 = 1;

           cmp.exp2 = 1;
           cmp.exp4 = 1;
           fixture.detectChanges();
           engine.flush();

           players = engine.players;
           cancelAllPlayers(players);
           expect(players.length).toEqual(3);

           cmp.exp0 = 2;

           cmp.exp1 = 2;
           cmp.exp2 = 2;
           cmp.exp3 = 2;
           cmp.exp4 = 2;
           cmp.exp5 = 2;
           fixture.detectChanges();
           engine.flush();

           players = engine.players;
           cancelAllPlayers(players);
           expect(players.length).toEqual(6);

           cmp.exp0 = 3;
           fixture.detectChanges();
           engine.flush();

           players = engine.players;
           cancelAllPlayers(players);
           expect(players.length).toEqual(1);
         });

      it('should collect styles for the same elements between queries', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div [@myAnimation]="exp">
              <header></header> 
              <footer></footer> 
            </div>
          `,
          animations: [
            trigger('myAnimation', [
              transition('* => go', [
                query(':self, header, footer', style({opacity: '0.01'})),
                animate(1000, style({opacity: '1'})),
                query('header, footer', [
                  stagger(500, [
                    animate(1000, style({opacity: '1'}))
                  ])
                ])
              ])
            ])
          ]
        })
        class Cmp {
          public exp: any;
          public items: any[] = [0, 1, 2];
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        cmp.exp = 'go';
        fixture.detectChanges();
        engine.flush();

        const players = getLog();
        expect(players.length).toEqual(6);

        const [p1, p2, p3, p4, p5, p6] = players;

        expect(p1.delay).toEqual(0);
        expect(p1.duration).toEqual(0);
        expect(p1.keyframes).toEqual([
          {opacity: '0.01', offset: 0},
          {opacity: '0.01', offset: 1},
        ]);

        expect(p2.delay).toEqual(0);
        expect(p2.duration).toEqual(0);
        expect(p2.keyframes).toEqual([
          {opacity: '0.01', offset: 0},
          {opacity: '0.01', offset: 1},
        ]);

        expect(p3.delay).toEqual(0);
        expect(p3.duration).toEqual(0);
        expect(p3.keyframes).toEqual([
          {opacity: '0.01', offset: 0},
          {opacity: '0.01', offset: 1},
        ]);

        expect(p4.delay).toEqual(0);
        expect(p4.duration).toEqual(1000);
        expect(p4.keyframes).toEqual([
          {opacity: '0.01', offset: 0},
          {opacity: '1', offset: 1},
        ]);

        expect(p5.delay).toEqual(1000);
        expect(p5.duration).toEqual(1000);
        expect(p5.keyframes).toEqual([
          {opacity: '0.01', offset: 0},
          {opacity: '1', offset: 1},
        ]);

        expect(p6.delay).toEqual(1500);
        expect(p6.duration).toEqual(1000);
        expect(p6.keyframes).toEqual([
          {opacity: '0.01', offset: 0},
          {opacity: '1', offset: 1},
        ]);
      });

      it('should retain style values when :self is used inside of a query', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div [@myAnimation]="exp"></div>
          `,
          animations: [trigger('myAnimation', [transition(
                                                  '* => go',
                                                  [
                                                    query(':self', style({opacity: '0.5'})),
                                                    animate(1000, style({opacity: '1'}))
                                                  ])])]
        })
        class Cmp {
          public exp: any;
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        cmp.exp = 'go';
        fixture.detectChanges();
        engine.flush();

        const players = getLog();
        expect(players.length).toEqual(2);

        const [p1, p2] = players;
        expect(p1.delay).toEqual(0);
        expect(p1.duration).toEqual(0);
        expect(p1.keyframes).toEqual([{opacity: '0.5', offset: 0}, {opacity: '0.5', offset: 1}]);

        expect(p2.delay).toEqual(0);
        expect(p2.duration).toEqual(1000);
        expect(p2.keyframes).toEqual([{opacity: '0.5', offset: 0}, {opacity: '1', offset: 1}]);
      });

      it('should properly apply stagger after various other steps within a query', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div [@myAnimation]="exp">
              <header></header> 
              <footer></footer> 
            </div>
          `,
          animations: [
            trigger('myAnimation', [
              transition('* => go', [
                query(':self, header, footer', [
                  style({opacity: '0'}),
                  animate(1000, style({opacity: '0.3'})),
                  animate(1000, style({opacity: '0.6'})),
                  stagger(500, [
                    animate(1000, style({opacity: '1'}))
                  ])
                ])
              ])
            ])
          ]
        })
        class Cmp {
          public exp: any;
          public items: any[] = [0, 1, 2];
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        cmp.exp = 'go';
        fixture.detectChanges();
        engine.flush();

        const players = getLog();
        expect(players.length).toEqual(3);

        const [p1, p2, p3] = players;

        expect(p1.delay).toEqual(0);
        expect(p1.duration).toEqual(3000);
        expect(p2.delay).toEqual(0);
        expect(p2.duration).toEqual(3500);
        expect(p3.delay).toEqual(0);
        expect(p3.duration).toEqual(4000);
      });

      it('should apply a full stagger step delay if the timing data is left undefined', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
          <div [@myAnimation]="exp">
            <div *ngFor="let item of items" class="item">
              {{ item }} 
            </div> 
          </div> 
        `,
          animations: [trigger(
              'myAnimation',
              [transition(
                  '* => go', [query('.item', [stagger('full',[
                                         style({opacity: 0}), animate(1000, style({opacity: .5})),
                                         animate(500, style({opacity: 1}))
                                       ])])])])]
        })
        class Cmp {
          public exp: any;
          public items: any[] = [0, 1, 2, 3, 4];
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        cmp.exp = 'go';
        fixture.detectChanges();
        engine.flush();

        const players = getLog();
        expect(players.length).toEqual(5);

        const [p1, p2, p3, p4, p5] = players;
        expect(p1.delay).toEqual(0);
        expect(p2.delay).toEqual(1500);
        expect(p3.delay).toEqual(3000);
        expect(p4.delay).toEqual(4500);
        expect(p5.delay).toEqual(6000);
      });

      it('should persist inner sub trigger styles once their animation is complete', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div @parent *ngIf="exp1">
              <div class="child" [@child]="exp2"></div>
            </div>
          `,
          animations: [
            trigger(
                'parent',
                [
                  transition(
                      ':enter',
                      [
                        query(
                            '.child',
                            [
                              animateChild(),
                            ]),
                      ]),
                ]),
            trigger(
                'child',
                [
                  state('*, void', style({height: '0px'})),
                  state('b', style({height: '444px'})),
                  transition('* => *', animate(500)),
                ]),
          ]
        })
        class Cmp {
          public exp1: any;
          public exp2: any;
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        cmp.exp1 = true;
        cmp.exp2 = 'b';
        fixture.detectChanges();
        engine.flush();

        const players = getLog();
        expect(players.length).toEqual(1);
        const player = players[0];

        expect(player.keyframes).toEqual([
          {height: '0px', offset: 0}, {height: '444px', offset: 1}
        ]);
        player.finish();

        expect(player.element.style.height).toEqual('444px');
      });

      it('should find newly inserted items in the component via :enter', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div @myAnimation>
              <div *ngFor="let item of items" class="child">
                {{ item }} 
              </div> 
            </div>
          `,
          animations: [trigger(
              'myAnimation',
              [
                transition(
                    ':enter',
                    [
                      query(
                          ':enter',
                          [
                            style({opacity: 0}),
                            animate(1000, style({opacity: .5})),
                          ]),
                    ]),
              ])]
        })
        class Cmp {
          public items: any[] = [0, 1, 2];
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        fixture.detectChanges();
        engine.flush();

        const players = getLog();
        expect(players.length).toEqual(3);

        const [p1, p2, p3] = players;
        expect(p1.element.innerText.trim()).toEqual('0');
        expect(p2.element.innerText.trim()).toEqual('1');
        expect(p3.element.innerText.trim()).toEqual('2');

        players.forEach(p => {
          expect(p.keyframes).toEqual([{opacity: '0', offset: 0}, {opacity: '0.5', offset: 1}]);
        });
      });

      it('should find elements that have been removed via :leave', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div [@myAnimation]="exp" class="parent">
              <div *ngFor="let item of items" class="child">
                {{ item }} 
              </div> 
            </div>
          `,
          animations: [trigger(
              'myAnimation',
              [
                transition(
                    'a => b',
                    [query(':leave', [style({opacity: 1}), animate(1000, style({opacity: .5}))])]),
              ])]
        })
        class Cmp {
          public exp: any;
          public items: any[] = [4, 2, 0];
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        cmp.exp = 'a';
        fixture.detectChanges();
        engine.flush();
        resetLog();

        cmp.exp = 'b';
        cmp.items = [];
        fixture.detectChanges();
        engine.flush();

        const players = getLog();
        expect(players.length).toEqual(3);

        const [p1, p2, p3] = players;
        expect(p1.element.innerText.trim()).toEqual('4');
        expect(p2.element.innerText.trim()).toEqual('2');
        expect(p3.element.innerText.trim()).toEqual('0');

        players.forEach(p => {
          expect(p.keyframes).toEqual([{opacity: '1', offset: 0}, {opacity: '0.5', offset: 1}]);
        });
      });

      it('should properly cancel items that were queried into a former animation', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div [@myAnimation]="exp" class="parent">
              <div *ngFor="let item of items" class="child">
                {{ item }} 
              </div> 
            </div>
          `,
          animations: [trigger(
            'myAnimation',
            [
              transition('* => on', [
                query(':enter', [style({opacity: 0}), animate(1000, style({opacity: 1}))]),
                query(':enter', [style({width: 0}), animate(1000, style({height: 200}))])
              ]),
              transition('* => off', [
                query(':leave', [animate(1000, style({width: 0}))]),
                query(':leave', [animate(1000, style({opacity: 0}))])
              ]),
            ])]
        })
        class Cmp {
          public exp: any;
          public items: any[];
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        cmp.exp = 'on';
        cmp.items = [0, 1, 2, 3, 4];
        fixture.detectChanges();
        engine.flush();

        const previousPlayers = getLog();
        expect(previousPlayers.length).toEqual(10);
        resetLog();

        cmp.exp = 'off';
        cmp.items = [0, 1, 2];
        fixture.detectChanges();
        engine.flush();

        const players = getLog();
        expect(players.length).toEqual(4);

        const [p1, p2, p3, p4] = players;
        const [p1p1, p1p2] = p1.previousPlayers;
        const [p2p1, p2p2] = p2.previousPlayers;

        expect(p1p1).toBe(previousPlayers[3]);
        expect(p1p2).toBe(previousPlayers[8]);
        expect(p2p1).toBe(previousPlayers[4]);
        expect(p2p2).toBe(previousPlayers[9]);

        expect(p3.previousPlayers).toEqual([]);
        expect(p4.previousPlayers).toEqual([]);
      });

      it('should finish queried players in an animation when the next animation takes over', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div [@myAnimation]="exp" class="parent">
              <div *ngFor="let item of items" class="child">
                {{ item }} 
              </div> 
            </div>
          `,
          animations: [trigger(
              'myAnimation',
              [
                transition(
                    '* => on',
                    [
                      query(':enter', [style({opacity: 0}), animate(1000, style({opacity: 1}))]),
                    ]),
                transition('* => off', [])
              ])]
        })
        class Cmp {
          public exp: any;
          public items: any[];
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        cmp.exp = 'on';
        cmp.items = [0, 1, 2, 3, 4];
        fixture.detectChanges();
        engine.flush();

        const players = getLog();
        expect(players.length).toEqual(5);

        let count = 0;
        players.forEach(p => { p.onDone(() => count++); });

        expect(count).toEqual(0);

        cmp.exp = 'off';
        fixture.detectChanges();
        engine.flush();

        expect(count).toEqual(5);
      });

      it('should finish queried players when the previous player is finished', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div [@myAnimation]="exp" class="parent">
              <div *ngFor="let item of items" class="child">
                {{ item }} 
              </div> 
            </div>
          `,
          animations: [trigger(
              'myAnimation',
              [
                transition(
                    '* => on',
                    [
                      query(':enter', [style({opacity: 0}), animate(1000, style({opacity: 1}))]),
                    ]),
                transition('* => off', [])
              ])]
        })
        class Cmp {
          public exp: any;
          public items: any[];
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        cmp.exp = 'on';
        cmp.items = [0, 1, 2, 3, 4];
        fixture.detectChanges();
        engine.flush();

        const players = getLog();
        expect(players.length).toEqual(5);

        let count = 0;
        players.forEach(p => { p.onDone(() => count++); });

        expect(count).toEqual(0);

        expect(engine.players.length).toEqual(1);
        engine.players[0].finish();

        expect(count).toEqual(5);
      });

      it('should allow multiple triggers to animate on queried elements at the same time', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div [@one]="exp1" [@two]="exp2" class="parent">
              <div *ngFor="let item of items" class="child">
                {{ item }} 
              </div> 
            </div>
          `,
          animations: [
            trigger('one', [
              transition('* => on', [
                query('.child', [
                  style({width: '0px'}),
                  animate(1000, style({width: '100px'}))
                ])
              ]),
              transition('* => off', [])
            ]),
            trigger('two', [
              transition('* => on', [
                query('.child:nth-child(odd)', [
                  style({height: '0px'}),
                  animate(1000, style({height: '100px'}))
                ])
              ]),
              transition('* => off', [])
            ])
          ]
        })
        class Cmp {
          public exp1: any;
          public exp2: any;
          public items: any[];
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        cmp.exp1 = 'on';
        cmp.items = [0, 1, 2, 3, 4];
        fixture.detectChanges();
        engine.flush();

        let players = getLog();
        expect(players.length).toEqual(5);

        let count = 0;
        players.forEach(p => { p.onDone(() => count++); });

        resetLog();

        expect(count).toEqual(0);

        cmp.exp2 = 'on';
        fixture.detectChanges();
        engine.flush();

        expect(count).toEqual(0);

        players = getLog();
        expect(players.length).toEqual(3);

        players.forEach(p => { p.onDone(() => count++); });

        cmp.exp1 = 'off';
        fixture.detectChanges();
        engine.flush();

        expect(count).toEqual(5);

        cmp.exp2 = 'off';
        fixture.detectChanges();
        engine.flush();

        expect(count).toEqual(8);
      });

      it('should not cancel inner queried animations if a trigger state value changes, but isn\'t detected as a valid transition',
         () => {
           @Component({
             selector: 'ani-cmp',
             template: `
            <div [@myAnimation]="exp" class="parent">
              <div *ngFor="let item of items" class="child">
                {{ item }} 
              </div> 
            </div>
          `,
             animations: [trigger(
                 'myAnimation',
                 [transition(
                     '* => on',
                     [
                       query(':enter', [style({opacity: 0}), animate(1000, style({opacity: 1}))]),
                     ])])]
           })
           class Cmp {
             public exp: any;
             public items: any[];
           }

           TestBed.configureTestingModule({declarations: [Cmp]});

           const engine = TestBed.get(ɵAnimationEngine);
           const fixture = TestBed.createComponent(Cmp);
           const cmp = fixture.componentInstance;

           cmp.exp = 'on';
           cmp.items = [0, 1, 2, 3, 4];
           fixture.detectChanges();
           engine.flush();

           const players = getLog();
           expect(players.length).toEqual(5);

           let count = 0;
           players.forEach(p => { p.onDone(() => count++); });

           expect(count).toEqual(0);

           cmp.exp = 'off';
           fixture.detectChanges();
           engine.flush();

           expect(count).toEqual(0);
         });

      it('should allow for queried items to restore their styling back to the original state via animate(time, "*")',
         () => {
           @Component({
            selector: 'ani-cmp',
            template: `
            <div [@myAnimation]="exp" class="parent">
              <div *ngFor="let item of items" class="child">
                {{ item }} 
              </div> 
            </div>
          `,
            animations: [
              trigger('myAnimation', [
                transition('* => on', [
                  query(':enter', [
                    style({opacity: '0', width: '0px', height: '0px'}),
                    animate(1000, style({opacity: '1'})),
                    animate(1000, style(['*', {height: '200px'}]))
                  ])
                ])
              ])
            ]
          })
          class Cmp {
             public exp: any;
             public items: any[];
           }

           TestBed.configureTestingModule({declarations: [Cmp]});

           const engine = TestBed.get(ɵAnimationEngine);
           const fixture = TestBed.createComponent(Cmp);
           const cmp = fixture.componentInstance;

           cmp.exp = 'on';
           cmp.items = [0, 1, 2];
           fixture.detectChanges();
           engine.flush();

           const players = getLog();
           expect(players.length).toEqual(3);

           players.forEach(p => {
             expect(p.keyframes).toEqual([
               {opacity: '0', width: '0px', height: '0px', offset: 0},
               {opacity: '1', width: '0px', height: '0px', offset: .5},
               {opacity: AUTO_STYLE, width: AUTO_STYLE, height: '200px', offset: 1}
             ]);
           });
         });

      it('should query elements in sub components that do not contain animations using the :enter selector',
         () => {
           @Component({
             selector: 'parent-cmp',
             template: `
            <div [@myAnimation]="exp">
              <child-cmp #child></child-cmp>
            </div>
          `,
             animations: [trigger(
                 'myAnimation',
                 [transition(
                     '* => on',
                     [query(
                         ':enter', [style({opacity: 0}), animate(1000, style({opacity: 1}))])])])]
           })
           class ParentCmp {
             public exp: any;

             @ViewChild('child') public child: any;
           }

           @Component({
             selector: 'child-cmp',
             template: `
            <div *ngFor="let item of items">
              {{ item }}
            </div>
          `
           })
           class ChildCmp {
             public items: any[] = [];
           }

           TestBed.configureTestingModule({declarations: [ParentCmp, ChildCmp]});
           const fixture = TestBed.createComponent(ParentCmp);
           const cmp = fixture.componentInstance;
           fixture.detectChanges();

           cmp.exp = 'on';
           cmp.child.items = [1, 2, 3];
           fixture.detectChanges();

           const players = getLog() as any[];
           expect(players.length).toEqual(3);

           expect(players[0].element.innerText.trim()).toEqual('1');
           expect(players[1].element.innerText.trim()).toEqual('2');
           expect(players[2].element.innerText.trim()).toEqual('3');
         });

      it('should query elements in sub components that do not contain animations using the :leave selector',
         () => {
           @Component({
             selector: 'parent-cmp',
             template: `
            <div [@myAnimation]="exp">
              <child-cmp #child></child-cmp>
            </div>
          `,
             animations: [trigger(
                 'myAnimation',
                 [transition(
                     '* => on', [query(':leave', [animate(1000, style({opacity: 0}))])])])]
           })
           class ParentCmp {
             public exp: any;

             @ViewChild('child') public child: any;
           }

           @Component({
             selector: 'child-cmp',
             template: `
            <div *ngFor="let item of items">
              {{ item }}
            </div>
          `
           })
           class ChildCmp {
             public items: any[] = [];
           }

           TestBed.configureTestingModule({declarations: [ParentCmp, ChildCmp]});
           const fixture = TestBed.createComponent(ParentCmp);
           const cmp = fixture.componentInstance;
           cmp.child.items = [4, 5, 6];
           fixture.detectChanges();

           cmp.exp = 'on';
           cmp.child.items = [];
           fixture.detectChanges();

           const players = getLog() as any[];
           expect(players.length).toEqual(3);

           expect(players[0].element.innerText.trim()).toEqual('4');
           expect(players[1].element.innerText.trim()).toEqual('5');
           expect(players[2].element.innerText.trim()).toEqual('6');
         });
    });

    describe('sub triggers', () => {
      it('should animate a sub trigger that exists in an inner element in the template', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div #parent class="parent" [@parent]="exp1">
              <div #child class="child" [@child]="exp2"></div>
            </div>
          `,
          animations: [
            trigger('parent', [transition(
                                  '* => go1',
                                  [
                                    style({width: '0px'}), animate(1000, style({width: '100px'})),
                                    query('.child', [animateChild()])
                                  ])]),
            trigger('child', [transition(
                                 '* => go2',
                                 [
                                   style({height: '0px'}),
                                   animate(1000, style({height: '100px'})),
                                 ])])
          ]
        })
        class Cmp {
          public exp1: any;
          public exp2: any;

          @ViewChild('parent') public elm1: any;

          @ViewChild('child') public elm2: any;
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        cmp.exp1 = 'go1';
        cmp.exp2 = 'go2';
        fixture.detectChanges();
        engine.flush();

        const elm1 = cmp.elm1;
        const elm2 = cmp.elm2;

        const [p1, p2] = getLog();
        expect(p1.delay).toEqual(0);
        expect(p1.element).toEqual(elm1.nativeElement);
        expect(p1.duration).toEqual(1000);
        expect(p1.keyframes).toEqual([{width: '0px', offset: 0}, {width: '100px', offset: 1}]);

        expect(p2.delay).toEqual(0);
        expect(p2.element).toEqual(elm2.nativeElement);
        expect(p2.duration).toEqual(2000);
        expect(p2.keyframes).toEqual([
          {height: '0px', offset: 0}, {height: '0px', offset: .5}, {height: '100px', offset: 1}
        ]);
      });

      it('should run and operate a series of triggers on a list of elements with overridden timing data',
         () => {
           @Component({
             selector: 'ani-cmp',
             template: `
            <div #parent class="parent" [@parent]="exp">
              <div class="item" *ngFor="let item of items" @child></div>
            </div>
          `,
             animations: [
               trigger('parent', [transition(
                                     '* => go',
                                     [
                                       style({opacity: '0'}), animate(1000, style({opacity: '1'})),
                                       query('.item', [animateChild({ duration: '2.5s', delay: '500ms' })]),
                                       animate(1000, style({opacity: '0'}))
                                     ])]),
               trigger('child', [transition(
                                    ':enter',
                                    [
                                      style({height: '0px'}),
                                      animate(1000, style({height: '100px'})),
                                    ])])
             ]
           })
           class Cmp {
             public exp: any;
             public items: any[] = [0, 1, 2, 3, 4];

             @ViewChild('parent') public elm: any;
           }

           TestBed.configureTestingModule({declarations: [Cmp]});

           const engine = TestBed.get(ɵAnimationEngine);
           const fixture = TestBed.createComponent(Cmp);
           const cmp = fixture.componentInstance;

           cmp.exp = 'go';
           fixture.detectChanges();
           engine.flush();

           const parent = cmp.elm.nativeElement;
           const elements = parent.querySelectorAll('.item');

           const players = getLog();
           expect(players.length).toEqual(7);
           const [pA, pc1, pc2, pc3, pc4, pc5, pZ] = players;

           expect(pA.element).toEqual(parent);
           expect(pA.delay).toEqual(0);
           expect(pA.duration).toEqual(1000);

           expect(pc1.element).toEqual(elements[0]);
           expect(pc1.delay).toEqual(0);
           expect(pc1.duration).toEqual(4000);

           expect(pc2.element).toEqual(elements[1]);
           expect(pc2.delay).toEqual(0);
           expect(pc2.duration).toEqual(4000);

           expect(pc3.element).toEqual(elements[2]);
           expect(pc3.delay).toEqual(0);
           expect(pc3.duration).toEqual(4000);

           expect(pc4.element).toEqual(elements[3]);
           expect(pc4.delay).toEqual(0);
           expect(pc4.duration).toEqual(4000);

           expect(pc5.element).toEqual(elements[4]);
           expect(pc5.delay).toEqual(0);
           expect(pc5.duration).toEqual(4000);

           expect(pZ.element).toEqual(parent);
           expect(pZ.delay).toEqual(4000);
           expect(pZ.duration).toEqual(1000);
         });

      it('should silently continue if a sub trigger is animated that doesn\'t exist', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div #parent class="parent" [@parent]="exp">
              <div class="child"></div>
            </div>
          `,
          animations:
              [trigger('parent', [transition(
                                     '* => go',
                                     [
                                       style({opacity: 0}), animate(1000, style({opacity: 1})),
                                       query('.child', [animateChild({duration: '1s'})]),
                                       animate(1000, style({opacity: 0}))
                                     ])])]
        })
        class Cmp {
          public exp: any;
          public items: any[] = [0, 1, 2, 3, 4];

          @ViewChild('parent') public elm: any;
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        cmp.exp = 'go';
        fixture.detectChanges();
        engine.flush();

        const parent = cmp.elm.nativeElement;
        const players = getLog();
        expect(players.length).toEqual(2);

        const [pA, pZ] = players;
        expect(pA.element).toEqual(parent);
        expect(pA.delay).toEqual(0);
        expect(pA.duration).toEqual(1000);

        expect(pZ.element).toEqual(parent);
        expect(pZ.delay).toEqual(1000);
        expect(pZ.duration).toEqual(1000);
      });

      it('should silently continue if a sub trigger is animated that doesn\'t contain a trigger that is setup for animation',
         () => {
           @Component({
             selector: 'ani-cmp',
             template: `
            <div #parent class="parent" [@parent]="exp1">
              <div [@child]="exp2" class="child"></div>
            </div>
          `,
             animations: [
               trigger('child', [transition(
                                    'a => z',
                                    [style({opacity: 0}), animate(1000, style({opacity: 1}))])]),
               trigger('parent', [transition(
                                     'a => z',
                                     [
                                       style({opacity: 0}), animate(1000, style({opacity: 1})),
                                       query('.child', [animateChild({duration: '1s'})]),
                                       animate(1000, style({opacity: 0}))
                                     ])])
             ]
           })
           class Cmp {
             public exp1: any;
             public exp2: any;

             @ViewChild('parent') public elm: any;
           }

           TestBed.configureTestingModule({declarations: [Cmp]});

           const engine = TestBed.get(ɵAnimationEngine);
           const fixture = TestBed.createComponent(Cmp);
           const cmp = fixture.componentInstance;

           cmp.exp1 = 'a';
           cmp.exp2 = 'a';
           fixture.detectChanges();
           engine.flush();
           resetLog();

           cmp.exp1 = 'z';
           fixture.detectChanges();
           engine.flush();

           const parent = cmp.elm.nativeElement;
           const players = getLog();
           expect(players.length).toEqual(2);

           const [pA, pZ] = players;
           expect(pA.element).toEqual(parent);
           expect(pA.delay).toEqual(0);
           expect(pA.duration).toEqual(1000);

           expect(pZ.element).toEqual(parent);
           expect(pZ.delay).toEqual(1000);
           expect(pZ.duration).toEqual(1000);
         });

      it('should animate all sub triggers on the element at the same time', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div #parent class="parent" [@parent]="exp1">
              <div [@w]="exp2" [@h]="exp2" class="child"></div>
            </div>
          `,
          animations: [
            trigger('w', [
              transition('* => go', [
                style({ width: 0 }),
                animate(1800, style({ width: '100px' }))
              ])
            ]),
            trigger('h', [
              transition('* => go', [
                style({ height: 0 }),
                animate(1500, style({ height: '100px' }))
              ])
            ]),
            trigger('parent', [
              transition('* => go', [
                style({ opacity: 0 }),
                animate(1000, style({ opacity: 1 })),
                query('.child', [
                  animateChild()
                ]),
                animate(1000, style({ opacity: 0 }))
              ])
            ])
          ]
        })
        class Cmp {
          public exp1: any;
          public exp2: any;

          @ViewChild('parent') public elm: any;
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        cmp.exp1 = 'go';
        cmp.exp2 = 'go';
        fixture.detectChanges();
        engine.flush();

        const players = getLog();
        expect(players.length).toEqual(4);
        const [pA, pc1, pc2, pZ] = players;

        expect(pc1.delay).toEqual(0);
        expect(pc1.duration).toEqual(2800);

        expect(pc2.delay).toEqual(0);
        expect(pc2.duration).toEqual(2500);

        expect(pZ.delay).toEqual(2800);
        expect(pZ.duration).toEqual(1000);
      });

      it('should skip a sub animation when a zero duration value is passed in', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div #parent class="parent" [@parent]="exp1">
              <div [@child]="exp2" class="child"></div>
            </div>
          `,
          animations: [
            trigger('child', [transition(
                                 '* => go',
                                 [style({width: 0}), animate(1800, style({width: '100px'}))])]),
            trigger('parent', [transition(
                                  '* => go',
                                  [
                                    style({opacity: 0}), animate(1000, style({opacity: 1})),
                                    query('.child', [animateChild({duration: '0'})]),
                                    animate(1000, style({opacity: 0}))
                                  ])])
          ]
        })
        class Cmp {
          public exp1: any;
          public exp2: any;

          @ViewChild('parent') public elm: any;
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        cmp.exp1 = 'go';
        cmp.exp2 = 'go';
        fixture.detectChanges();
        engine.flush();

        const players = getLog();
        expect(players.length).toEqual(2);
        const [pA, pZ] = players;

        expect(pA.delay).toEqual(0);
        expect(pA.duration).toEqual(1000);

        expect(pZ.delay).toEqual(1000);
        expect(pZ.duration).toEqual(1000);
      });

      it('should only allow a sub animation to be used up by a parent trigger once', () => {
        @Component({
          selector: 'ani-cmp',
          template: `
            <div [@parent]="exp1" class="parent1" #parent>
              <div [@parent]="exp1" class="parent2">
                <div [@child]="exp2" class="child">
                </div>
              </div>
            </div>
          `,
          animations: [
            trigger('parent', [transition(
                                  '* => go',
                                  [
                                    style({opacity: 0}), animate(1000, style({opacity: 1})),
                                    query('.child', animateChild())
                                  ])]),
            trigger('child', [transition(
                                 '* => go',
                                 [style({opacity: 0}), animate(1800, style({opacity: 1}))])])
          ]
        })
        class Cmp {
          public exp1: any;
          public exp2: any;

          @ViewChild('parent') public elm: any;
        }

        TestBed.configureTestingModule({declarations: [Cmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(Cmp);
        const cmp = fixture.componentInstance;

        cmp.exp1 = 'go';
        cmp.exp2 = 'go';
        fixture.detectChanges();
        engine.flush();

        const players = getLog();
        expect(players.length).toEqual(3);

        const [p1, p2, p3] = players;

        // parent2 is evaluated first because it is inside of parent1
        expect(p1.element.classList.contains('parent2')).toBeTruthy();
        expect(p2.element.classList.contains('child')).toBeTruthy();
        expect(p3.element.classList.contains('parent1')).toBeTruthy();
      });

      it('should emulate a leave animation on the nearest sub host elements when a parent is removed',
         fakeAsync(() => {
           @Component({
             selector: 'ani-cmp',
             template: `
            <div @parent *ngIf="exp" class="parent1" #parent>
              <child-cmp #child @leave (@leave.start)="animateStart($event)"></child-cmp>
            </div>
          `,
             animations: [
               trigger(
                   'leave',
                   [
                     transition(':leave', [animate(1000, style({color: 'gold'}))]),
                   ]),
               trigger(
                   'parent',
                   [
                     transition(':leave', [query(':leave', animateChild())]),
                   ]),
             ]
           })
           class ParentCmp {
             public exp: boolean = true;
             @ViewChild('child') public childElm: any;

             public childEvent: any;

             animateStart(event: any) {
               if (event.toState == 'void') {
                 this.childEvent = event;
               }
             }
           }

           @Component({
             selector: 'child-cmp',
             template: '...',
             animations: [
               trigger(
                   'child',
                   [
                     transition(':leave', [animate(1000, style({color: 'gold'}))]),
                   ]),
             ]
           })
           class ChildCmp {
             public childEvent: any;

             @HostBinding('@child') public animate = true;

             @HostListener('@child.start', ['$event'])
             animateStart(event: any) {
               if (event.toState == 'void') {
                 this.childEvent = event;
               }
             }
           }

           TestBed.configureTestingModule({declarations: [ParentCmp, ChildCmp]});

           const engine = TestBed.get(ɵAnimationEngine);
           const fixture = TestBed.createComponent(ParentCmp);
           const cmp = fixture.componentInstance;

           fixture.detectChanges();
           engine.flush();

           const childCmp = cmp.childElm;

           cmp.exp = false;
           fixture.detectChanges();
           engine.flush();
           flushMicrotasks();

           expect(cmp.childEvent.toState).toEqual('void');
           expect(cmp.childEvent.totalTime).toEqual(1000);
           expect(childCmp.childEvent.toState).toEqual('void');
           expect(childCmp.childEvent.totalTime).toEqual(1000);
         }));

      it('should only mark outermost *directive nodes :enter and :leave when inserts and removals occur',
         () => {
           @Component({
             selector: 'ani-cmp',
             animations: [
               trigger(
                   'anim',
                   [
                     transition(
                         '* => enter',
                         [
                           query(':enter', [animate(1000, style({color: 'red'}))]),
                         ]),
                     transition(
                         '* => leave',
                         [
                           query(':leave', [animate(1000, style({color: 'blue'}))]),
                         ]),
                   ]),
             ],
             template: `
            <section class="container" [@anim]="exp ? 'enter' : 'leave'">
              <div class="a" *ngIf="exp">
                <div class="b" *ngIf="exp">
                  <div class="c" *ngIf="exp">
                    text
                  </div>
                </div>
              </div>
              <div>
                <div class="d" *ngIf="exp">
                  text2
                </div>
              </div>
            </section>
          `
           })
           class Cmp {
             public exp: boolean;
           }

           TestBed.configureTestingModule({declarations: [Cmp]});

           const engine = TestBed.get(ɵAnimationEngine);
           const fixture = TestBed.createComponent(Cmp);
           const cmp = fixture.componentInstance;
           const container = fixture.elementRef.nativeElement;

           cmp.exp = true;
           fixture.detectChanges();
           engine.flush();

           let players = getLog();
           resetLog();
           expect(players.length).toEqual(2);
           const [p1, p2] = players;

           expect(p1.element.classList.contains('a'));
           expect(p2.element.classList.contains('d'));

           cmp.exp = false;
           fixture.detectChanges();
           engine.flush();

           players = getLog();
           resetLog();
           expect(players.length).toEqual(2);
           const [p3, p4] = players;

           expect(p3.element.classList.contains('a'));
           expect(p4.element.classList.contains('d'));
         });

      it('should emulate leave animation callbacks for all sub elements that have leave triggers within the component',
         fakeAsync(() => {
           @Component({
             selector: 'ani-cmp',
             animations: [
               trigger('parent', []), trigger('child', []),
               trigger(
                   'childWithAnimation',
                   [
                     transition(
                         ':leave',
                         [
                           animate(1000, style({background: 'red'})),
                         ]),
                   ])
             ],
             template: `
            <div data-name="p" class="parent" @parent *ngIf="exp" (@parent.start)="callback($event)" (@parent.done)="callback($event)">
              <div data-name="c1" @child (@child.start)="callback($event)" (@child.done)="callback($event)"></div>
              <div data-name="c2" @child (@child.start)="callback($event)" (@child.done)="callback($event)"></div>
              <div data-name="c3" @childWithAnimation (@childWithAnimation.start)="callback($event)" (@childWithAnimation.done)="callback($event)"></div>
            </div>
          `
           })
           class Cmp {
             public exp: boolean;
             public log: string[] = [];
             callback(event: any) {
               this.log.push(event.element.getAttribute('data-name') + '-' + event.phaseName);
             }
           }

           TestBed.configureTestingModule({declarations: [Cmp]});

           const engine = TestBed.get(ɵAnimationEngine);
           const fixture = TestBed.createComponent(Cmp);
           const cmp = fixture.componentInstance;

           cmp.exp = true;
           fixture.detectChanges();
           flushMicrotasks();
           cmp.log = [];

           cmp.exp = false;
           fixture.detectChanges();
           flushMicrotasks();
           expect(cmp.log).toEqual([
             'c1-start', 'c1-done', 'c2-start', 'c2-done', 'p-start', 'p-done', 'c3-start',
             'c3-done'
           ]);
         }));

      it('should build, but not run sub triggers when a parent animation is scheduled', () => {
        @Component({
          selector: 'parent-cmp',
          animations:
              [trigger('parent', [transition('* => *', [animate(1000, style({opacity: 0}))])])],
          template: '<div [@parent]="exp"><child-cmp #child></child-cmp></div>'
        })
        class ParentCmp {
          public exp: any;

          @ViewChild('child') public childCmp: any;
        }

        @Component({
          selector: 'child-cmp',
          animations:
              [trigger('child', [transition('* => *', [animate(1000, style({color: 'red'}))])])],
          template: '<div [@child]="exp"></div>'
        })
        class ChildCmp {
          public exp: any;
        }

        TestBed.configureTestingModule({declarations: [ParentCmp, ChildCmp]});

        const engine = TestBed.get(ɵAnimationEngine);
        const fixture = TestBed.createComponent(ParentCmp);
        fixture.detectChanges();
        engine.flush();
        resetLog();

        const cmp = fixture.componentInstance;
        const childCmp = cmp.childCmp;

        cmp.exp = 1;
        childCmp.exp = 1;
        fixture.detectChanges();
        engine.flush();

        // we have 2 players, but the child is not used even though
        // it is created.
        const players = getLog();
        expect(players.length).toEqual(2);
        expect(engine.players.length).toEqual(1);

        expect(engine.players[0].getRealPlayer()).toBe(players[1]);
      });

      it('should stretch the starting keyframe of a child animation queries are issued by the parent',
         () => {
           @Component({
             selector: 'parent-cmp',
             animations: [trigger(
                 'parent',
                 [transition(
                     '* => *',
                     [animate(1000, style({color: 'red'})), query('@child', animateChild())])])],
             template: '<div [@parent]="exp"><child-cmp #child></child-cmp></div>'
           })
           class ParentCmp {
             public exp: any;

             @ViewChild('child') public childCmp: any;
           }

           @Component({
             selector: 'child-cmp',
             animations: [trigger(
                 'child',
                 [transition(
                     '* => *', [style({color: 'blue'}), animate(1000, style({color: 'red'}))])])],
             template: '<div [@child]="exp" class="child"></div>'
           })
           class ChildCmp {
             public exp: any;
           }

           TestBed.configureTestingModule({declarations: [ParentCmp, ChildCmp]});

           const engine = TestBed.get(ɵAnimationEngine);
           const fixture = TestBed.createComponent(ParentCmp);
           fixture.detectChanges();
           engine.flush();
           resetLog();

           const cmp = fixture.componentInstance;
           const childCmp = cmp.childCmp;

           cmp.exp = 1;
           childCmp.exp = 1;
           fixture.detectChanges();
           engine.flush();

           expect(engine.players.length).toEqual(1);  // child player, parent cover, parent player
           const groupPlayer = engine.players[0].getRealPlayer() as AnimationGroupPlayer;
           const childPlayer = groupPlayer.players.find(player => {
             if (player instanceof MockAnimationPlayer) {
               return matchesElement(player.element, '.child');
             }
             return false;
           }) as MockAnimationPlayer;

           const keyframes = childPlayer.keyframes.map(kf => {
             delete kf['offset'];
             return kf;
           });

           expect(keyframes.length).toEqual(3);

           const [k1, k2, k3] = keyframes;
           expect(k1).toEqual(k2);
         });

      it('should allow a parent trigger to control child triggers across multiple template boundaries even if there are no animations in between',
         () => {
           @Component({
             selector: 'parent-cmp',
             animations: [
               trigger(
                   'parentAnimation',
                   [
                     transition(
                         '* => go',
                         [
                           query(':self, @grandChildAnimation', style({opacity: 0})),
                           animate(1000, style({opacity: 1})),
                           query(
                               '@grandChildAnimation',
                               [
                                 animate(1000, style({opacity: 1})),
                                 animateChild(),
                               ]),
                         ]),
                   ]),
             ],
             template: '<div [@parentAnimation]="exp"><child-cmp #child></child-cmp></div>'
           })
           class ParentCmp {
             public exp: any;

             @ViewChild('child') public innerCmp: any;
           }

           @Component(
               {selector: 'child-cmp', template: '<grandchild-cmp #grandchild></grandchild-cmp>'})
           class ChildCmp {
             @ViewChild('grandchild') public innerCmp: any;
           }

           @Component({
             selector: 'grandchild-cmp',
             animations: [
               trigger(
                   'grandChildAnimation',
                   [
                     transition(
                         '* => go',
                         [
                           style({width: '0px'}),
                           animate(1000, style({width: '200px'})),
                         ]),
                   ]),
             ],
             template: '<div [@grandChildAnimation]="exp"></div>'
           })
           class GrandChildCmp {
             public exp: any;
           }

           TestBed.configureTestingModule({declarations: [ParentCmp, ChildCmp, GrandChildCmp]});

           const engine = TestBed.get(ɵAnimationEngine);
           const fixture = TestBed.createComponent(ParentCmp);
           fixture.detectChanges();
           engine.flush();
           resetLog();

           const cmp = fixture.componentInstance;
           const grandChildCmp = cmp.innerCmp.innerCmp;

           cmp.exp = 'go';
           grandChildCmp.exp = 'go';

           fixture.detectChanges();
           engine.flush();
           const players = getLog();
           expect(players.length).toEqual(5);
           const [p1, p2, p3, p4, p5] = players;

           expect(p5.keyframes).toEqual([
             {offset: 0, width: '0px'}, {offset: .67, width: '0px'}, {offset: 1, width: '200px'}
           ]);
         });
    });
  });
}

function cancelAllPlayers(players: AnimationPlayer[]) {
  players.forEach(p => p.destroy());
}
