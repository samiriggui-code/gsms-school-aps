'use client';

import { cn } from '@/lib/utils';

interface RatingProps {
  className?: string;
  rating: number;
  round?: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses: Record<NonNullable<RatingProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Rating({ className, rating, round, size = 'md' }: RatingProps) {
  return (
    <div className={cn('rating', className)}>
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className={cn(
            'kt-rating-label',
            index < rating ? 'checked' : '',
            index === rating && round ? 'indeterminate' : '',
          )}
        >
          {index === rating && round ? (
            <i
              className={cn('kt-rating-on ki-solid ki-star leading-none', sizeClasses[size])}
              style={{ width: `${round * 100}%` }}
            ></i>
          ) : (
            <i
              className={cn('kt-rating-on ki-solid ki-star leading-none', sizeClasses[size])}
            ></i>
          )}
          <i className={cn('kt-rating-off ki-outline ki-star leading-none', sizeClasses[size])}></i>
        </div>
      ))}
    </div>
  );
}
