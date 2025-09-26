'use client';

import * as React from 'react';
import './segmented-control.css';
import classNames from 'classnames';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';

interface SegmentedControlRootProps {
  className?: string;
  children?: React.ReactNode;
  color?: 'default' | 'primary' | 'blue';
  radius?: 'none' | 'small' | 'medium' | 'large' | 'full';
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const SegmentedControlRoot = React.forwardRef<HTMLDivElement, SegmentedControlRootProps>(
  ({ className, children, radius, color = 'default', ...props }, ref) => {
    return (
      <ToggleGroupPrimitive.Root
        ref={ref}
        className={classNames('rt-SegmentedControlRoot', 
          {
            'rt-SegmentedControlRoot-default': color === 'default',
            'rt-SegmentedControlRoot-primary': color === 'primary',
            'rt-SegmentedControlRoot-blue': color === 'blue'
          },
          className
        )}
        data-radius={radius}
        type="single"
        {...props}
      >
        {children}
      </ToggleGroupPrimitive.Root>
    );
  }
);

SegmentedControlRoot.displayName = 'SegmentedControl.Root';

type SegmentedControlItemProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>;

const SegmentedControlItem = React.forwardRef<HTMLButtonElement, SegmentedControlItemProps>(
  ({ className, ...props }, ref) => (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={classNames('rt-SegmentedControlItem', className)}
      {...props}
    />
  )
);

SegmentedControlItem.displayName = 'SegmentedControl.Item';

export { SegmentedControlRoot as Root, SegmentedControlItem as Item };
export type { SegmentedControlRootProps as RootProps, SegmentedControlItemProps as ItemProps };
