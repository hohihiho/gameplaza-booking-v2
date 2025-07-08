'use client';

import { useEffect, useRef, useState } from 'react';

interface GoogleMapProps {
  address: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

let isGoogleMapsLoading = false;
let isGoogleMapsLoaded = false;

export default function GoogleMap({ address }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current || !window.google) return;

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 17,
        center: { lat: 35.148460388183594, lng: 126.91423797607422 }, // 게임플라자 정확한 좌표
        mapTypeControl: false,
        streetViewControl: true,
        fullscreenControl: true,
      });

      // 마커 생성
      const marker = new window.google.maps.Marker({
        position: { lat: 35.148460388183594, lng: 126.91423797607422 },
        map: map,
        title: '게임플라자 광주점',
      });

      // 정보창 생성
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 5px 0; font-weight: bold;">게임플라자 광주점</h3>
            <p style="margin: 0; color: #666;">${address}</p>
          </div>
        `,
      });

      // 마커 클릭 시 정보창 표시
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      // 기본으로 정보창 열기
      infoWindow.open(map, marker);
      setMapLoaded(true);
    };

    // Google Maps API가 이미 로드되었는지 확인
    if (isGoogleMapsLoaded && window.google) {
      initializeMap();
      return;
    }

    // 이미 로딩 중이면 기다림
    if (isGoogleMapsLoading) {
      const checkInterval = setInterval(() => {
        if (isGoogleMapsLoaded && window.google) {
          clearInterval(checkInterval);
          initializeMap();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    // Google Maps 스크립트 로드
    isGoogleMapsLoading = true;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      isGoogleMapsLoaded = true;
      isGoogleMapsLoading = false;
      initializeMap();
    };

    script.onerror = () => {
      isGoogleMapsLoading = false;
      console.error('Google Maps 스크립트 로드 실패');
    };

    document.head.appendChild(script);

    return () => {
      // cleanup if needed
    };
  }, [address]);

  return (
    <div 
      ref={mapRef}
      className="w-full h-full"
      style={{ minHeight: '100%' }}
    />
  );
}