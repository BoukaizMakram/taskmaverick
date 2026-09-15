import { useId } from 'react';

export default function LoadingLogo() {
  const id = useId();
  return (
      <svg
        className="tm-loader-logo"
        width="80"
        height="82"
        viewBox="0 0 53 54"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <mask id={`${id}-m0`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="26" y="13" width="27" height="40">
          <path d="M26.3677 13.6309H52.639V52.927H26.3677V13.6309Z" fill="white" />
        </mask>
        <g mask={`url(#${id}-m0)`}>
          <path className="tm-pet tm-pet--red" fillRule="evenodd" clipRule="evenodd" d="M39.6085 26.4031L29.0915 29.1996L26.3677 40.1361L38.7495 52.9279C39.5122 52.6659 40.2166 52.2377 40.8083 51.6634L50.9324 41.8366C52.0228 40.7783 52.639 39.3162 52.639 37.7881V15.4374C52.639 14.8169 52.5359 14.2079 52.3422 13.6318L39.6085 26.4031Z" fill="#D13A71" />
        </g>
        <path className="tm-pet tm-pet--green" fillRule="evenodd" clipRule="evenodd" d="M23.5705 29.3167L12.9134 26.5518L0.316895 39.5643C0.618381 40.4302 1.12685 41.218 1.81193 41.8491L12.5715 51.7626C13.5936 52.7045 14.9266 53.2264 16.3093 53.2264H36.9656C37.5781 53.2264 38.1804 53.1232 38.7501 52.9276L26.3683 40.1357L23.5705 29.3167Z" fill="#3AD1A2" />
        <mask id={`${id}-m1`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="13" y="0" width="40" height="27">
          <path d="M13.7856 0H52.3427V26.4046H13.7856V0Z" fill="white" />
        </mask>
        <g mask={`url(#${id}-m1)`}>
          <path className="tm-pet tm-pet--orange" fillRule="evenodd" clipRule="evenodd" d="M29.0616 23.6893L39.6089 26.4047L52.3427 13.6334C52.0593 12.7906 51.5805 12.0188 50.9328 11.3902L40.8088 1.56335C39.7753 0.560116 38.3981 0 36.9654 0H16.3091C15.4248 0 14.5611 0.214563 13.7856 0.614984L26.2434 12.7797L29.0616 23.6893Z" fill="#FFA23A" />
        </g>
        <mask id={`${id}-m2`} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="27" height="40">
          <path d="M0 0.614258H26.2437V39.5657H0V0.614258Z" fill="white" />
        </mask>
        <g mask={`url(#${id}-m2)`}>
          <path className="tm-pet tm-pet--blue" fillRule="evenodd" clipRule="evenodd" d="M23.5298 23.6539L26.2437 12.7789L13.7859 0.614258C13.349 0.839722 12.9398 1.12369 12.5715 1.46306L1.81197 11.3766C0.657772 12.4399 0 13.9459 0 15.5247V37.7022C0 38.3439 0.110317 38.9729 0.316938 39.5657L12.9134 26.5531L23.5298 23.6539Z" fill="#3BA2D1" />
        </g>
      </svg>
  );
}
