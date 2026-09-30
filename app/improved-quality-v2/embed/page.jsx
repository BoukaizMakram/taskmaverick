import ImprovedQualityV2Demo from '@/components/ImprovedQualityV2Demo';
import {clipParams} from '@/lib/clipParams.mjs';

export const metadata={title:'Improved Quality — clip',robots:{index:false}};

// A slice of the storytelling cut (?clip=alerts&mode=preview), shown in the
// Assets Library (/assets-library).
export default async function Page({searchParams}){
 return <ImprovedQualityV2Demo embed {...clipParams(await searchParams)}/>;
}
