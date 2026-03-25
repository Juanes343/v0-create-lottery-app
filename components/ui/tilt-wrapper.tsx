
"use client";

import Tilt from 'react-parallax-tilt';

export function TiltWrapper({ children, ...props }: any) {
  return <Tilt {...props}>{children}</Tilt>;
}

