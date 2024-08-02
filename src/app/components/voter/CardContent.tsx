import { calculateAge } from '@/app/utils/lib';
import { useQRCode } from 'next-qrcode'
import { forwardRef, useRef } from "react";
import Image from 'next/image';
import { useReactToPrint } from "react-to-print";

interface Props {
    cardData: CardDetails | null;

}
const ComponentToPrint = forwardRef<HTMLDivElement, Props>((props, ref) => {
    const { cardData } = props;
    
    const { Canvas } = useQRCode()

    return (
        <div className="flex items-center flex-col" ref={ref}>
            <h2 className="font-bold text-xl text-center text-green-600 mb-4">Print your Voter&apos;s card</h2>
           
            <div className=" mx-auto rounded-lg shadow-md mb-6 card p-3">
                <h3 className="text-center text-sm font-bold">FEDERAL REPUBLIC OF NIGERIA</h3>
                <h3 className="text-center text-sm font-bold">  INDEPENDENT NATIONAL ELECTORAL COMMISSION</h3>
                <h3 className="text-center text-sm font-bold mb-3">  VOTER&apos;S CARD</h3>

                <section className="w-full flex items-start space-x-3 justify-between">
                    <div className=" w-1/3 bg-white rounded-md">
                        <Image src={cardData?.image!} alt={`${cardData?.first_name}`} width={300}  height={300}/>
                    </div>
                    <div className="w-2/3">
                        
                          <section className="mb-[5px] flex items-center space-x-2">
                            <p className=" font-semibold text-sm text-red-700 uppercase">{cardData?._vin}</p>
                        </section>

                        <section className="mb-[5px]">
                            <p className="text-xs">NAME:</p>
                            <p className="text-xs font-semibold">{`${cardData?.last_name.toUpperCase()}, ${cardData?.first_name} ${cardData?.other_name}`}</p>
                        </section>

                      
                        <section className="mb-[5px] ">
                            <p className="text-xs">HOME ADDRESS:</p>
                            <p className="text-xs font-semibold">{`${cardData?.home_addr}, ${cardData?.home_lga}`}</p>
                        </section>
                        <section className="mb-[5px]  flex items-center space-x-3">
                            <p className="text-xs">AGE:</p>
                            <p className="text-xs font-semibold">{calculateAge(cardData?.date_of_birth)}</p>
                        </section>
                        <section className="mb-[5px]  flex items-center space-x-3">
                            <p className="text-xs">OCCUPATION:</p>
                            <p className="text-xs font-semibold">{cardData?.occupation}</p>
                        </section>
                        
                        
                        
                        
                    </div>
                </section>

                <section className='w-full flex items-baseline justify-between'>
                    <div>
                        <p className='text-xs text-gray-500 font-bold italic'>Verified and Issued by INEC</p>
                    </div>
                    <Canvas
                        text={'http://localhost:3000/vote/card'}
                        options={{
                            type: 'image/jpeg',
                            quality: 0.3,
                            errorCorrectionLevel: 'M',
                            margin: 3,
                            scale: 4,
                            width: 50,
                            color: {
                                dark: '#50B498',
                                light: '#FFf',
                            },
                        }}
                    />
                </section>

            </div>
         
        </div>
        
    )
})

ComponentToPrint.displayName = "ComponentToPrint";

export default function CardContent({ cardData }: Props) { 
    const componentRef = useRef<any>();

    const handlePrint = useReactToPrint({
		documentTitle: "Voting Card",
		content: () => componentRef.current,
	});

    return (
        <main className='flex items-center justify-center h-screen flex-col px-5'>
            {cardData && <ComponentToPrint ref={componentRef} cardData={cardData}/>}
            
            
            <button className="md:w-[200px] bg-green-600 text-white w-full py-2 rounded-md" onClick={handlePrint}>Download</button>
            
        </main>
        
    )
}