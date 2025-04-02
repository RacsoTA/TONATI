import React from "react";
import ActivarBandeja from "./ActivarBandeja";

const BandejaPendiente = ({
  bandeja_id,
  onBandejaActivated,
  refreshBandejas,
}) => {
  return (
    <ActivarBandeja
      bandeja_id={bandeja_id}
      onBandejaActivated={onBandejaActivated}
      refreshBandejas={refreshBandejas}
    />
  );
};

export default BandejaPendiente;
