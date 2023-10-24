import React from 'react'

function Topbuttons(setQuery) {

    const cities = [
        {
            id: 1,
            city: "London"
        },
        {
            id: 2,
            city: "Sydney"
        },
        {
            id: 3,
            city: "Tokyo"
        },
        {
            id: 4,
            city: "Toronto"
        },
        {
            id: 5,
            city: "Paris"
        }
    ]

    return (
        <div className='flex items-center justify-around my-6'>
            {cities.map((city) => (
                <button key={city.id} className="text-white text-lg font-medium" onClick={() => setQuery({ q: city.title })}>
                    {city.title}
                </button>

            ))
            }
        </div >
    )
}

export default Topbuttons