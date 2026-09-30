import EfficiencyV2Demo from '@/components/EfficiencyV2Demo';
import {clipParams} from '@/lib/clipParams.mjs';

export const metadata={title:'Increased Efficiency — clip',robots:{index:false}};

// A slice of the storytelling cut (?clip=claim&mode=preview), shown in the
// Assets Library (/assets-library).
export default async function Page({searchParams}){
 return <EfficiencyV2Demo embed {...clipParams(await searchParams)}/>;
}
