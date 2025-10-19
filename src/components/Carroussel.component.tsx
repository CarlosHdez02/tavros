'use client'
import dynamic from "next/dynamic";
import React from "react";

const GalleryComponent = dynamic(() => import('./Gallery.component'));
const TableComponent = dynamic(() => import('./Table.component'));
const VideoComponents = dynamic(()=> import('./Video-cards-container.component'));

export interface CarrouselInterface {
    id: number;
    currentComponent: React.ComponentType<any>;
}

const carrouselComponents: CarrouselInterface[] = [
    {
        id: 1,
        currentComponent: TableComponent
    },
    {
        id:2,
        currentComponent:VideoComponents
    },
    {
        id: 3,
        currentComponent: GalleryComponent
    }
];

const CarrouselWrapper = () => {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % carrouselComponents.length);
        }, 200000);
        return () => clearInterval(interval);
    }, []);

    const CurrentComponent = carrouselComponents[currentIndex].currentComponent;

    return (
        <div>
            <CurrentComponent />
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {carrouselComponents.map((component,index) => (
                    <button
                        key={component.id}
                        onClick={() => setCurrentIndex(index)}
                        style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: index === currentIndex ? '#ccc' : '#000',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s'
                        }}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default CarrouselWrapper;