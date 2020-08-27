import { Input, OnDestroy, OnInit, forwardRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { bem, noop } from './utils';
import { NgAisInstantSearch } from './instantsearch/instantsearch';
import { NgAisIndex } from './index-widget/index-widget';
import { Widget } from 'instantsearch.js/es/types';
export { Widget };

// TODO: use Connector type from InstantSearch. Not yet possible now,
// since non-ts connectors can't have generics like Connector has,
// as well as sometimes being not accurate enough / missing keys.
export type Connector = (
  renderFn: (state: object, isFirstRendering: boolean) => void,
  unmountFn: () => void
) => (widgetOptions?: object) => Widget;

export abstract class BaseWidget implements OnInit, OnDestroy {
  @Input() public autoHideContainer?: boolean;

  public widget?: Widget;
  public state?: object = {};
  public cx: ReturnType<typeof bem>;
  public abstract instantSearchInstance: NgAisInstantSearch;
  public abstract parentIndex?: NgAisIndex;

  constructor(widgetName: string) {
    this.cx = bem(widgetName);
  }

  get parent() {
    if (this.parentIndex) {
      return this.parentIndex;
    }
    return this.instantSearchInstance;
  }

  public createWidget(connector: Connector, options: object = {}) {
    this.widget = connector(this.updateState, noop)(options);
  }

  public ngOnInit() {
    this.parent.addWidgets([this.widget]);
  }

  public ngOnDestroy() {
    if (isPlatformBrowser(this.instantSearchInstance.platformId)) {
      this.parent.removeWidgets([this.widget]);
    }
  }

  public updateState = (
    state: {},
    isFirstRendering: boolean
  ): Promise<void> | void => {
    if (isFirstRendering) {
      return Promise.resolve().then(() => {
        this.state = state;
      });
    }

    this.state = state;
  };

  /**
   * Helper to generate class names for an item
   * @param item element to generate a class name for
   */
  public getItemClass(item: { isRefined?: boolean }) {
    const className = this.cx('item');

    if (item.isRefined) {
      return `${className} ${this.cx('item', 'selected')}`;
    }

    return className;
  }
}
